import type { ParameterDef } from "./templates";

export function renderParameterForm(
  container: HTMLElement,
  parameters: ParameterDef[],
  onChange: (context: Record<string, unknown>) => void
): void {
  container.innerHTML = "";

  if (parameters.length === 0) {
    container.innerHTML = "<p>No configurable parameters.</p>";
    return;
  }

  const form = document.createElement("form");
  form.className = "parameter-form";
  form.addEventListener("submit", (e) => e.preventDefault());

  for (const param of parameters) {
    const id = `param-${param.key}`;
    const row = document.createElement("div");
    row.className = `param-row param-type-${param.type}`;

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = param.label;

    let input: HTMLInputElement;

    if (param.type === "boolean") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      input.checked = param.defaultValue as boolean;
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
    } else {
      input = document.createElement("input");
      input.id = id;
      input.dataset.key = param.key;

      if (param.type === "number") {
        input.type = "number";
        input.value = String(param.defaultValue);
        input.dataset.paramType = "number";
        if (param.validation?.min !== undefined) input.min = String(param.validation.min);
        if (param.validation?.max !== undefined) input.max = String(param.validation.max);
      } else {
        input.type = "text";
        input.value = param.defaultValue as string;
        input.dataset.paramType = "string";
      }

      row.appendChild(label);
      row.appendChild(input);
    }

    form.appendChild(row);
  }

  container.appendChild(form);

  form.addEventListener("change", () => {
    onChange(getParameterValues(form));
  });

  form.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.dataset.paramType !== "boolean") {
      onChange(getParameterValues(form));
    }
  });
}

function getParameterValues(form: HTMLFormElement): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  const inputs = form.querySelectorAll<HTMLInputElement>("input[data-key]");
  for (const input of inputs) {
    const key = input.dataset.key!;
    const type = input.dataset.paramType;
    if (type === "boolean") {
      context[key] = input.checked;
    } else if (type === "number") {
      const num = Number(input.value);
      context[key] = isNaN(num) ? 0 : num;
    } else {
      context[key] = input.value;
    }
  }
  return context;
}

export function getDefaultContext(parameters: ParameterDef[]): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  for (const param of parameters) {
    context[param.key] = param.defaultValue;
  }
  return context;
}
