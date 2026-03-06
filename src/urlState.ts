import type { ParameterDef } from "./templates";

export interface UrlState {
  template: string | null;
  paramOverrides: Record<string, unknown>;
}

export function getStateFromURL(parameters?: ParameterDef[]): UrlState {
  const params = new URLSearchParams(window.location.search);
  const template = params.get("template");

  const paramOverrides: Record<string, unknown> = {};
  if (parameters) {
    for (const def of parameters) {
      const raw = params.get(def.key);
      if (raw === null) continue;
      paramOverrides[def.key] = coerceValue(raw, def.type);
    }
  }

  return { template, paramOverrides };
}

function coerceValue(raw: string, type: string): unknown {
  switch (type) {
    case "boolean":
      return raw === "true";
    case "number": {
      const num = Number(raw);
      return isNaN(num) ? 0 : num;
    }
    default:
      return raw;
  }
}

export function updateURL(
  templateKey: string,
  paramValues: Record<string, unknown>
): void {
  const params = new URLSearchParams();
  params.set("template", templateKey);
  for (const [key, value] of Object.entries(paramValues)) {
    params.set(key, String(value));
  }
  const url = `${window.location.pathname}?${params.toString()}`;
  history.replaceState(null, "", url);
}
