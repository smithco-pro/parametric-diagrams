import { describe, it, expect } from "vitest";
import {
  parseMmdx,
  compileTemplate,
  executeTemplate,
} from "../src/templateEngine";
import Handlebars from "handlebars";

describe("parseMmdx", () => {
  it("parses valid .mmdx with frontmatter and template", () => {
    const raw = `---
{
  "name": "Test Diagram",
  "parameters": [
    { "key": "show", "type": "boolean", "label": "Show?", "defaultValue": true }
  ]
}
---
graph TD
  A --> B`;

    const result = parseMmdx(raw);
    expect(result.meta.name).toBe("Test Diagram");
    expect(result.meta.parameters).toHaveLength(1);
    expect(result.meta.parameters[0].key).toBe("show");
    expect(result.template).toBe("graph TD\n  A --> B");
  });

  it("throws on missing frontmatter delimiters", () => {
    expect(() => parseMmdx("no frontmatter here")).toThrow(
      "Invalid .mmdx format"
    );
  });

  it("throws on invalid JSON in frontmatter", () => {
    const raw = `---
not valid json
---
template`;
    expect(() => parseMmdx(raw)).toThrow();
  });
});

describe("compileTemplate / executeTemplate", () => {
  it("compiles and executes a simple template", () => {
    const compiled = compileTemplate("Hello {{name}}!");
    const result = executeTemplate(compiled, { name: "World" });
    expect(result).toBe("Hello World!");
  });

  it("collapses multiple blank lines into one", () => {
    const compiled = compileTemplate("A\n\n\n\n\nB");
    const result = executeTemplate(compiled, {});
    expect(result).toBe("A\n\nB");
  });

  it("trims trailing whitespace per line", () => {
    const compiled = compileTemplate("hello   \nworld   ");
    const result = executeTemplate(compiled, {});
    expect(result).toBe("hello\nworld");
  });

  it("caches compiled templates", () => {
    const source = "cached-{{val}}";
    const a = compileTemplate(source);
    const b = compileTemplate(source);
    expect(a).toBe(b);
  });
});

describe("Handlebars helpers", () => {
  // Helpers are registered globally by importing templateEngine
  function evalHelper(helper: string, ...args: unknown[]): unknown {
    // Use Handlebars helpers directly
    const fn = Handlebars.helpers[helper];
    return fn(...args);
  }

  it("eq returns true for equal values", () => {
    expect(evalHelper("eq", "a", "a")).toBe(true);
    expect(evalHelper("eq", 1, 1)).toBe(true);
  });

  it("eq returns false for unequal values", () => {
    expect(evalHelper("eq", "a", "b")).toBe(false);
    expect(evalHelper("eq", 1, "1")).toBe(false); // strict equality
  });

  it("gt compares numerically", () => {
    expect(evalHelper("gt", 5, 3)).toBe(true);
    expect(evalHelper("gt", 3, 5)).toBe(false);
    expect(evalHelper("gt", 3, 3)).toBe(false);
  });

  it("not negates", () => {
    expect(evalHelper("not", false)).toBe(true);
    expect(evalHelper("not", true)).toBe(false);
    expect(evalHelper("not", 0)).toBe(true);
    expect(evalHelper("not", "")).toBe(true);
  });

  it("and returns truthy when both truthy", () => {
    expect(evalHelper("and", true, true)).toBe(true);
    expect(evalHelper("and", true, false)).toBe(false);
    expect(evalHelper("and", false, true)).toBe(false);
  });

  it("or returns truthy when either truthy", () => {
    expect(evalHelper("or", false, true)).toBe(true);
    expect(evalHelper("or", true, false)).toBe(true);
    expect(evalHelper("or", false, false)).toBe(false);
  });

  it("countTrue counts truthy arguments (excluding options hash)", () => {
    // Handlebars passes an options object as the last arg
    const optionsHash = { hash: {} };
    expect(evalHelper("countTrue", true, false, true, optionsHash)).toBe(2);
    expect(evalHelper("countTrue", false, false, optionsHash)).toBe(0);
    expect(evalHelper("countTrue", true, true, true, optionsHash)).toBe(3);
  });
});
