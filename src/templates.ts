import { parseMmdx, compileTemplate } from "./templateEngine";
import type { MmdxMeta } from "./templateEngine";

export type { MmdxMeta };
export type ParameterDef = MmdxMeta["parameters"][number];

export interface DiagramTemplate {
  name: string;
  template: string;
  compiled: HandlebarsTemplateDelegate;
  compiledNotes?: HandlebarsTemplateDelegate;
  parameters: ParameterDef[];
}

function loadTemplate(raw: string): DiagramTemplate {
  const { meta, template } = parseMmdx(raw);
  return {
    name: meta.name,
    template,
    compiled: compileTemplate(template),
    compiledNotes: meta.notes ? compileTemplate(meta.notes) : undefined,
    parameters: meta.parameters,
  };
}

// Templates are inlined into the startup bundle by the eager glob below, so
// their combined source size is pure first-load weight. Past this budget,
// switch the glob to lazy (drop `eager: true` and load each template's source
// on selection) so only the shown template is fetched. Sized at ~4x the current
// payload — headroom for roughly 40 more templates before code-splitting earns
// its keep. The budget is enforced at load time (dev warning) and in CI (see
// tests/templateBudget.test.ts).
export const TEMPLATE_SOURCE_BUDGET_BYTES = 512 * 1024;

const mmdxModules = import.meta.glob<string>("./templates/*.mmdx", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** Total UTF-8 byte size of every eager-loaded .mmdx source — the template
 *  contribution to the startup bundle. */
export function getTemplateSourceBytes(): number {
  const encoder = new TextEncoder();
  let total = 0;
  for (const raw of Object.values(mmdxModules)) {
    total += encoder.encode(raw).length;
  }
  return total;
}

if (import.meta.env.DEV) {
  const bytes = getTemplateSourceBytes();
  if (bytes > TEMPLATE_SOURCE_BUDGET_BYTES) {
    console.warn(
      `[templates] Eager .mmdx payload is ${(bytes / 1024).toFixed(0)} KB, over ` +
        `the ${(TEMPLATE_SOURCE_BUDGET_BYTES / 1024).toFixed(0)} KB budget. Switch ` +
        `import.meta.glob in src/templates.ts to lazy (remove eager:true) so ` +
        `templates load on selection instead of at startup.`
    );
  }
}

export const templates: Record<string, DiagramTemplate> = Object.fromEntries(
  Object.entries(mmdxModules).map(([path, raw]) => {
    const key = path.replace("./templates/", "").replace(".mmdx", "");
    return [key, loadTemplate(raw)];
  })
);
