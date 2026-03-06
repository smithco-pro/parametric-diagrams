import type { ParameterDef } from "./templates";

export function renderParameterForm(
  container: HTMLElement,
  parameters: ParameterDef[],
  onChange: (context: Record<string, unknown>) => void,
  initialValues?: Record<string, unknown>
): void {
  container.innerHTML = "";

  if (parameters.length === 0) {
    container.innerHTML = "<p>No configurable parameters.</p>";
    return;
  }

  const form = document.createElement("form");
  form.className = "parameter-form";
  form.addEventListener("submit", (e) => e.preventDefault());

  const depthMap = getDepthMap(parameters);

  for (const param of parameters) {
    const id = `param-${param.key}`;
    const row = document.createElement("div");
    row.className = `param-row param-type-${param.type}`;
    row.dataset.paramKey = param.key;
    row.dataset.defaultValue = String(param.defaultValue);
    if (param.showWhen) {
      row.dataset.showWhenKey = param.showWhen.key;
      row.dataset.showWhenValue = String(param.showWhen.value);
    }
    const depth = depthMap.get(param.key) ?? 0;
    if (depth > 0) {
      row.dataset.depth = String(depth);
    }

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = param.label;

    let input: HTMLInputElement;

    if (param.type === "boolean") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      input.checked = (initialValues?.[param.key] ?? param.defaultValue) as boolean;
      input.dataset.key = param.key;
      input.dataset.paramType = "boolean";

      const toggle = document.createElement("span");
      toggle.className = "toggle-switch";
      toggle.addEventListener("click", () => {
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });

      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(toggle);
    } else if (param.type === "select") {
      const select = document.createElement("select");
      select.id = id;
      select.dataset.key = param.key;
      select.dataset.paramType = "select";

      for (const opt of param.options ?? []) {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        const selectedValue = initialValues?.[param.key] ?? param.defaultValue;
        if (opt.value === selectedValue) option.selected = true;
        select.appendChild(option);
      }

      row.appendChild(label);
      row.appendChild(select);
    } else {
      input = document.createElement("input");
      input.id = id;
      input.dataset.key = param.key;

      if (param.type === "number") {
        input.type = "number";
        input.value = String(initialValues?.[param.key] ?? param.defaultValue);
        input.dataset.paramType = "number";
        if (param.validation?.min !== undefined) input.min = String(param.validation.min);
        if (param.validation?.max !== undefined) input.max = String(param.validation.max);
      } else {
        input.type = "text";
        input.value = (initialValues?.[param.key] ?? param.defaultValue) as string;
        input.dataset.paramType = "string";
      }

      row.appendChild(label);
      row.appendChild(input);
    }

    form.appendChild(row);
  }

  container.appendChild(form);

  updateVisibility(form);

  form.addEventListener("change", () => {
    updateVisibility(form);
    onChange(getParameterValues(form));
  });

  form.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.dataset.paramType !== "boolean") {
      updateVisibility(form);
      onChange(getParameterValues(form));
    }
  });
}

function getDepthMap(parameters: ParameterDef[]): Map<string, number> {
  const depths = new Map<string, number>();
  for (const param of parameters) {
    if (param.showWhen) {
      depths.set(param.key, (depths.get(param.showWhen.key) ?? 0) + 1);
    }
  }
  return depths;
}

function updateVisibility(form: HTMLFormElement): void {
  const rows = form.querySelectorAll<HTMLDivElement>(".param-row");
  const hiddenKeys = new Set<string>();

  for (const row of rows) {
    const depKey = row.dataset.showWhenKey;
    if (!depKey) continue;

    const depValue = row.dataset.showWhenValue!;
    const paramKey = row.dataset.paramKey!;

    // If the dependency itself is hidden, this param is also hidden
    if (hiddenKeys.has(depKey)) {
      hiddenKeys.add(paramKey);
      if (!row.classList.contains("hidden")) {
        row.classList.add("hidden");
        resetToDefault(row);
      }
      continue;
    }

    // Get the current value of the dependency
    const depEl = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-key="${depKey}"]`);
    if (!depEl) continue;

    const currentValue = depEl.dataset.paramType === "boolean"
      ? String((depEl as HTMLInputElement).checked)
      : depEl.value;

    if (currentValue === depValue) {
      row.classList.remove("hidden");
    } else {
      hiddenKeys.add(paramKey);
      if (!row.classList.contains("hidden")) {
        row.classList.add("hidden");
        resetToDefault(row);
      }
    }
  }
}

function resetToDefault(row: HTMLDivElement): void {
  const el = row.querySelector<HTMLInputElement | HTMLSelectElement>("[data-key]");
  if (!el) return;
  const defaultVal = row.dataset.defaultValue!;
  if (el.dataset.paramType === "boolean") {
    (el as HTMLInputElement).checked = defaultVal === "true";
  } else {
    el.value = defaultVal;
  }
}

function getParameterValues(form: HTMLFormElement): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  const elements = form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-key]");
  for (const el of elements) {
    const key = el.dataset.key!;
    const type = el.dataset.paramType;
    const row = el.closest<HTMLDivElement>(".param-row");
    const isHidden = row?.classList.contains("hidden");

    if (isHidden && row?.dataset.defaultValue !== undefined) {
      const defaultVal = row.dataset.defaultValue;
      if (type === "boolean") {
        context[key] = defaultVal === "true";
      } else if (type === "number") {
        const num = Number(defaultVal);
        context[key] = isNaN(num) ? 0 : num;
      } else {
        context[key] = defaultVal;
      }
    } else if (type === "boolean") {
      context[key] = (el as HTMLInputElement).checked;
    } else if (type === "number") {
      const num = Number(el.value);
      context[key] = isNaN(num) ? 0 : num;
    } else {
      context[key] = el.value;
    }
  }
  return context;
}

export function getDefaultContext(
  parameters: ParameterDef[],
  overrides?: Record<string, unknown>
): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  for (const param of parameters) {
    context[param.key] = overrides?.[param.key] ?? param.defaultValue;
  }
  return context;
}
