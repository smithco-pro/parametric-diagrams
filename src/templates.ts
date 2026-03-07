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

const mmdxModules = import.meta.glob<string>("./templates/*.mmdx", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const templates: Record<string, DiagramTemplate> = Object.fromEntries(
  Object.entries(mmdxModules).map(([path, raw]) => {
    const key = path.replace("./templates/", "").replace(".mmdx", "");
    return [key, loadTemplate(raw)];
  })
);
