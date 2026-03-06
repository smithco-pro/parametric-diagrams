import { parseMmdx, compileTemplate } from "./templateEngine";
import type { MmdxMeta } from "./templateEngine";

import networkRaw from "./templates/network.mmdx?raw";
import deploymentRaw from "./templates/deployment.mmdx?raw";
import sequenceRaw from "./templates/sequence.mmdx?raw";

export type { MmdxMeta };
export type ParameterDef = MmdxMeta["parameters"][number];

export interface DiagramTemplate {
  name: string;
  template: string;
  compiled: HandlebarsTemplateDelegate;
  parameters: ParameterDef[];
}

function loadTemplate(raw: string): DiagramTemplate {
  const { meta, template } = parseMmdx(raw);
  return {
    name: meta.name,
    template,
    compiled: compileTemplate(template),
    parameters: meta.parameters,
  };
}

export const templates: Record<string, DiagramTemplate> = {
  network: loadTemplate(networkRaw),
  deployment: loadTemplate(deploymentRaw),
  sequence: loadTemplate(sequenceRaw),
};
