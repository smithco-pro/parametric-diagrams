import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect, type Page } from "@playwright/test";
import { parseMmdx } from "../src/templateEngine";
import type { MmdxMeta } from "../src/templateEngine";

// Sweeps every Handlebars branch of every template through the real app:
// each boolean is set true and false, each select visits every option, each
// number visits its validation min/max, and two composite passes flip all
// booleans on then off. After every mutation we assert Mermaid produced an
// SVG and not its error <pre> — catching label-constraint breakage (pipes in
// node labels, parens in edge labels) that only specific conditional
// combinations emit.
//
// Render-completion signal (no sleeps): main.ts's updateDiagram() calls
// updateURL() — which writes every parameter value into the query string —
// only AFTER the Mermaid render awaited. So once location.search shows the
// value we just set, the render pipeline for that change has finished, even
// when the diagram source was unchanged and the re-render was skipped.

type ParamDef = MmdxMeta["parameters"][number];

const TEMPLATES_DIR = fileURLToPath(
  new URL("../src/templates", import.meta.url)
);

const templates = readdirSync(TEMPLATES_DIR)
  .filter((file) => file.endsWith(".mmdx"))
  .sort()
  .map((file) => {
    const raw = readFileSync(join(TEMPLATES_DIR, file), "utf8");
    return { key: basename(file, ".mmdx"), meta: parseMmdx(raw).meta };
  });

/** One gate assignment needed to reveal a showWhen-hidden control. */
interface GateStep {
  param: ParamDef;
  /** Stringified value the gate must hold for the dependent row to show. */
  value: string;
}

/** Walks showWhen ancestors outermost-first. Returns null when any gate is a
 *  type we cannot drive to an exact value (string/number) or is missing. */
function gateChainFor(
  param: ParamDef,
  byKey: Map<string, ParamDef>
): GateStep[] | null {
  const chain: GateStep[] = [];
  const seen = new Set([param.key]);
  let cur = param;
  while (cur.showWhen) {
    const gate = byKey.get(cur.showWhen.key);
    if (!gate || seen.has(gate.key)) return null;
    if (gate.type !== "boolean" && gate.type !== "select") return null;
    seen.add(gate.key);
    chain.unshift({ param: gate, value: String(cur.showWhen.value) });
    cur = gate;
  }
  return chain;
}

function row(page: Page, key: string) {
  return page.locator(`.param-row[data-param-key="${key}"]`);
}

async function isRowHidden(page: Page, key: string): Promise<boolean> {
  return row(page, key).evaluate((el) => el.classList.contains("hidden"));
}

async function assertRendered(
  page: Page,
  ctx: string,
  pageErrors: string[]
): Promise<void> {
  const errPre = page.locator("#mermaid-output pre");
  const errText =
    (await errPre.count()) > 0 ? await errPre.first().innerText() : null;
  expect(errText, `${ctx} — Mermaid render error shown`).toBeNull();
  expect(
    await page.locator("#mermaid-output svg").count(),
    `${ctx} — no SVG present in #mermaid-output`
  ).toBeGreaterThan(0);
  expect(pageErrors, `${ctx} — uncaught page error(s)`).toEqual([]);
}

/** Waits for the render pipeline to finish (see header comment), then asserts
 *  the diagram rendered cleanly. */
async function settle(
  page: Page,
  key: string,
  value: string,
  ctx: string,
  pageErrors: string[]
): Promise<void> {
  try {
    await page.waitForFunction(
      ([k, v]) => new URLSearchParams(window.location.search).get(k) === v,
      [key, value] as [string, string],
      { timeout: 15_000 }
    );
  } catch {
    const errPre = page.locator("#mermaid-output pre");
    const mermaidErr =
      (await errPre.count()) > 0 ? await errPre.first().innerText() : "none";
    throw new Error(
      `${ctx} — render pipeline never completed (URL never showed ${key}=${value}). ` +
        `Mermaid error: ${mermaidErr}. Page errors: ${
          pageErrors.join("; ") || "none"
        }`
    );
  }
  await assertRendered(page, ctx, pageErrors);
}

/** Sets a visible control to the given (stringified) value and waits for the
 *  resulting render. No-op when the control already holds the value. */
async function setParam(
  page: Page,
  param: ParamDef,
  value: string,
  ctx: string,
  pageErrors: string[]
): Promise<void> {
  const paramRow = row(page, param.key);
  if (param.type === "boolean") {
    const checkbox = paramRow.locator('input[type="checkbox"]');
    if (String(await checkbox.isChecked()) === value) return;
    await paramRow.locator(".toggle-switch").click();
  } else if (param.type === "select") {
    const select = paramRow.locator("select");
    if ((await select.inputValue()) === value) return;
    await select.selectOption(value);
  } else {
    const input = paramRow.locator("input");
    if ((await input.inputValue()) === value) return;
    await input.fill(value);
    // fill() only emits (debounced) "input" — dispatch "change" so the form
    // cancels the debounce and renders immediately, like a real blur.
    await input.dispatchEvent("change");
  }
  await settle(page, param.key, value, ctx, pageErrors);
}

/** Values to sweep for a parameter, ending with the default so the sweep
 *  leaves the control restored. Empty array means nothing beyond the default
 *  (strings, numbers without validation bounds). */
function sweepValues(param: ParamDef): string[] {
  if (param.type === "boolean") {
    return ["true", "false", String(param.defaultValue)];
  }
  if (param.type === "select") {
    const options = (param.options ?? []).map((opt) => opt.value);
    return [...options, String(param.defaultValue)];
  }
  if (param.type === "number") {
    const values: string[] = [];
    if (param.validation?.min !== undefined)
      values.push(String(param.validation.min));
    if (param.validation?.max !== undefined)
      values.push(String(param.validation.max));
    if (values.length === 0) return [];
    values.push(String(param.defaultValue));
    return values;
  }
  return []; // string params stay at their default
}

test.describe("template branches", () => {
  // The biggest template needs a couple hundred sequential renders.
  test.describe.configure({ timeout: 240_000 });

  for (const { key, meta } of templates) {
    test(`${key} — every parameter branch renders without a Mermaid error`, async ({
      page,
    }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (err) => pageErrors.push(String(err)));

      await page.goto(`./?template=${key}`);
      await expect(page.locator("#template-select")).toHaveValue(key);
      // updateURL() runs after the first render finishes, filling the query
      // string with every parameter — a deterministic "app is ready" signal.
      const firstParam = meta.parameters[0];
      if (firstParam) {
        await settle(
          page,
          firstParam.key,
          String(firstParam.defaultValue),
          `template "${key}": initial render with defaults`,
          pageErrors
        );
      } else {
        await expect(page.locator("#mermaid-output svg")).toBeVisible();
      }

      const byKey = new Map(meta.parameters.map((p) => [p.key, p]));

      // --- Per-parameter sweep (no reload between mutations) ---
      for (const param of meta.parameters) {
        const values = sweepValues(param);
        if (values.length === 0) continue;

        // Reveal showWhen-gated controls by driving their gate chain.
        const changedGates: GateStep[] = [];
        if (param.showWhen && (await isRowHidden(page, param.key))) {
          const chain = gateChainFor(param, byKey);
          if (!chain) {
            console.log(
              `[template-branches] ${key}: skipping "${param.key}" — its ` +
                `showWhen gate chain cannot be driven from the UI`
            );
            continue;
          }
          for (const step of chain) {
            const ctx = `template "${key}": gate "${step.param.key}" = ${step.value} (revealing "${param.key}")`;
            await setParam(page, step.param, step.value, ctx, pageErrors);
            changedGates.push(step);
          }
          if (await isRowHidden(page, param.key)) {
            console.log(
              `[template-branches] ${key}: skipping "${param.key}" — still ` +
                `hidden after setting its gate chain`
            );
          }
        }

        if (!(await isRowHidden(page, param.key))) {
          for (const value of values) {
            const ctx = `template "${key}": param "${param.key}" = ${value}`;
            await setParam(page, param, value, ctx, pageErrors);
          }
        }

        // Restore gates to defaults (innermost first); hiding a dependent row
        // makes the app reset its value to the default automatically.
        for (const step of changedGates.reverse()) {
          if (await isRowHidden(page, step.param.key)) continue;
          const def = String(step.param.defaultValue);
          const ctx = `template "${key}": restoring gate "${step.param.key}" = ${def}`;
          await setParam(page, step.param, def, ctx, pageErrors);
        }
      }

      // --- Composite passes: all booleans true, then all false (selects and
      // numbers back at defaults after the sweep above). Loop to a fixpoint so
      // booleans revealed by another boolean's gate get flipped too. Hidden
      // rows are skipped — the app resets those to defaults itself. ---
      for (const target of [true, false]) {
        for (let pass = 0, changed = true; changed && pass < 5; pass++) {
          changed = false;
          for (const param of meta.parameters) {
            if (param.type !== "boolean") continue;
            if (await isRowHidden(page, param.key)) continue;
            const checkbox = row(page, param.key).locator(
              'input[type="checkbox"]'
            );
            if ((await checkbox.isChecked()) === target) continue;
            const ctx = `template "${key}": composite all-booleans-${target}, param "${param.key}" = ${target}`;
            await setParam(page, param, String(target), ctx, pageErrors);
            changed = true;
          }
        }
      }
    });
  }
});
