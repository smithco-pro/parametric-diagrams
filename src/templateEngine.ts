import Handlebars from "handlebars";

Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper("gt", (a: unknown, b: unknown) => Number(a) > Number(b));
Handlebars.registerHelper("not", (a: unknown) => !a);
Handlebars.registerHelper("and", (a: unknown, b: unknown) => a && b);
Handlebars.registerHelper("or", (a: unknown, b: unknown) => a || b);
Handlebars.registerHelper("countTrue", function (...args: unknown[]) {
  // Last arg is Handlebars options hash — skip it
  return args.slice(0, -1).filter(Boolean).length;
});

export interface MmdxMeta {
  name: string;
  notes?: string;
  parameters: {
    key: string;
    type: "boolean" | "number" | "string" | "select";
    label: string;
    defaultValue: boolean | number | string;
    validation?: { min?: number; max?: number };
    options?: { label: string; value: string }[];
    showWhen?: { key: string; value: boolean | number | string };
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

// Characters that break Mermaid label parsing when spliced into node/edge
// labels: "|" is the edge-label delimiter, "(" ")" "[" "]" "{" "}" are
// node-shape syntax, and '"' terminates quoted labels. Mermaid supports
// numeric entity codes (e.g. #124;) inside labels and renders them as the
// literal character, so the diagram still displays what the user typed.
const MERMAID_LABEL_ESCAPES: Record<string, string> = {
  "|": "#124;",
  "(": "#40;",
  ")": "#41;",
  "[": "#91;",
  "]": "#93;",
  "{": "#123;",
  "}": "#125;",
  '"': "#34;",
};

export function sanitizeMermaidLabelValue(value: string): string {
  return value.replace(/[|()[\]{}"]/g, (ch) => MERMAID_LABEL_ESCAPES[ch]);
}

/**
 * Returns a copy of the parameter context safe to splice into the Mermaid
 * diagram body: string-typed parameter values (user-typed hostnames, IPs,
 * comments) have Mermaid-breaking characters replaced with numeric entity
 * codes. Use only for the diagram body — the frontmatter notes template
 * renders HTML and must receive the raw values.
 */
export function sanitizeMermaidContext(
  context: Record<string, unknown>,
  parameters: MmdxMeta["parameters"]
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...context };
  for (const param of parameters) {
    if (param.type !== "string") continue;
    const value = sanitized[param.key];
    if (typeof value === "string") {
      sanitized[param.key] = sanitizeMermaidLabelValue(value);
    }
  }
  return sanitized;
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
