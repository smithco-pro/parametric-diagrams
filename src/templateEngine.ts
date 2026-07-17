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
 * renders HTML and must receive values escaped by sanitizeNotesContext
 * instead. Both sanitizers expect the raw user value as input; never chain
 * them or values get double-escaped.
 */
// Shared traversal for both sanitizers: returns a copy of the context with the
// given escape function applied to every string-typed parameter value. The two
// render paths differ only in which escape function they pass.
function sanitizeStringParams(
  context: Record<string, unknown>,
  parameters: MmdxMeta["parameters"],
  escape: (value: string) => string
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = { ...context };
  for (const param of parameters) {
    if (param.type !== "string") continue;
    const value = sanitized[param.key];
    if (typeof value === "string") {
      sanitized[param.key] = escape(value);
    }
  }
  return sanitized;
}

export function sanitizeMermaidContext(
  context: Record<string, unknown>,
  parameters: MmdxMeta["parameters"]
): Record<string, unknown> {
  return sanitizeStringParams(context, parameters, sanitizeMermaidLabelValue);
}

// Characters that enable HTML/script injection when a parameter value is
// interpolated into the frontmatter notes template, whose output is assigned
// to innerHTML. Notes templates are compiled with noEscape (template authors
// write literal HTML markup), so user-controlled values — including ones
// arriving from a shared URL via urlState — must be escaped here instead.
const HTML_VALUE_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtmlValue(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_VALUE_ESCAPES[ch]);
}

/**
 * Returns a copy of the parameter context safe to splice into the frontmatter
 * notes template (rendered via innerHTML): string-typed parameter values are
 * HTML-escaped so a hostile value like `<img src=x onerror=...>` — typed into
 * a form field or smuggled in through a shared URL — renders as inert text.
 * Author-written markup in the notes template itself is untouched. Use only
 * for the notes path — the diagram body needs sanitizeMermaidContext. Both
 * sanitizers expect the raw user value as input; never chain them or values
 * get double-escaped.
 */
export function sanitizeNotesContext(
  context: Record<string, unknown>,
  parameters: MmdxMeta["parameters"]
): Record<string, unknown> {
  return sanitizeStringParams(context, parameters, escapeHtmlValue);
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
