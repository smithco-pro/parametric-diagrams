import Handlebars from "handlebars";

Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

export interface MmdxMeta {
  name: string;
  parameters: {
    key: string;
    type: "boolean" | "number" | "string" | "select";
    label: string;
    defaultValue: boolean | number | string;
    validation?: { min?: number; max?: number };
    options?: { label: string; value: string }[];
  }[];
}

export interface ParsedMmdx {
  meta: MmdxMeta;
  template: string;
}

export function parseMmdx(raw: string): ParsedMmdx {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = raw.match(frontmatterRegex);
  if (!match) {
    throw new Error("Invalid .mmdx format: missing frontmatter delimiters");
  }
  const meta: MmdxMeta = JSON.parse(match[1]);
  const template = match[2];
  return { meta, template };
}

const compiledCache = new Map<string, HandlebarsTemplateDelegate>();

export function compileTemplate(
  source: string
): HandlebarsTemplateDelegate {
  let compiled = compiledCache.get(source);
  if (!compiled) {
    compiled = Handlebars.compile(source, { noEscape: true });
    compiledCache.set(source, compiled);
  }
  return compiled;
}

export function executeTemplate(
  compiled: HandlebarsTemplateDelegate,
  context: Record<string, unknown>
): string {
  const raw = compiled(context);
  // Collapse multiple consecutive blank lines into one, trim trailing whitespace per line
  return raw
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
