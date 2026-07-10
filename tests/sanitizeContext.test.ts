import { describe, it, expect } from "vitest";
import {
  compileTemplate,
  executeTemplate,
  sanitizeMermaidContext,
  sanitizeMermaidLabelValue,
} from "../src/templateEngine";
import type { MmdxMeta } from "../src/templateEngine";

type ParameterDef = MmdxMeta["parameters"][number];

const parameters: ParameterDef[] = [
  { key: "serverName", type: "string", label: "Server Name", defaultValue: "srv01" },
  { key: "comment", type: "string", label: "Comment", defaultValue: "" },
  { key: "showComment", type: "boolean", label: "Show Comment?", defaultValue: true },
  { key: "nodeCount", type: "number", label: "Nodes", defaultValue: 2 },
  {
    key: "size",
    type: "select",
    label: "Size",
    defaultValue: "small (default)",
    options: [{ label: "Small (default)", value: "small (default)" }],
  },
];

describe("sanitizeMermaidLabelValue", () => {
  it("replaces | ( ) with Mermaid numeric entity codes", () => {
    expect(sanitizeMermaidLabelValue("srv|01 (prod)")).toBe(
      "srv#124;01 #40;prod#41;"
    );
  });

  it("replaces [ ] { } and double quotes with numeric entity codes", () => {
    expect(sanitizeMermaidLabelValue('rack B4] {east} "primary"')).toBe(
      "rack B4#93; #123;east#125; #34;primary#34;"
    );
    expect(sanitizeMermaidLabelValue("[note]")).toBe("#91;note#93;");
  });

  it("leaves safe strings untouched", () => {
    expect(sanitizeMermaidLabelValue("uag.example.com")).toBe("uag.example.com");
  });
});

describe("sanitizeMermaidContext", () => {
  it("escapes pipe and parentheses in string-typed parameter values", () => {
    const context = {
      serverName: "srv|01",
      comment: "primary (east)",
      showComment: true,
      nodeCount: 2,
      size: "small (default)",
    };
    const sanitized = sanitizeMermaidContext(context, parameters);

    expect(sanitized.serverName).toBe("srv#124;01");
    expect(sanitized.comment).toBe("primary #40;east#41;");
  });

  it("does not touch non-string-typed parameters", () => {
    const context = {
      serverName: "ok",
      comment: "",
      showComment: true,
      nodeCount: 2,
      size: "small (default)",
    };
    const sanitized = sanitizeMermaidContext(context, parameters);

    expect(sanitized.showComment).toBe(true);
    expect(sanitized.nodeCount).toBe(2);
    // select-typed values are template-author-controlled, not user-typed
    expect(sanitized.size).toBe("small (default)");
  });

  it("does not mutate the original context (notes need raw values)", () => {
    const context = { serverName: "srv|01 (prod)" };
    const sanitized = sanitizeMermaidContext(context, parameters);

    expect(context.serverName).toBe("srv|01 (prod)");
    expect(sanitized).not.toBe(context);
  });

  it("produces a Mermaid body free of raw | and parens in labels", () => {
    const compiled = compileTemplate(
      "graph LR\n  A[{{serverName}}]{{#if comment}} -->|443| B[{{comment}}]{{/if}}"
    );
    const sanitized = sanitizeMermaidContext(
      { serverName: "srv|01", comment: "primary (east)" },
      parameters
    );
    const body = executeTemplate(compiled, sanitized);

    expect(body).toContain("A[srv#124;01]");
    expect(body).toContain("B[primary #40;east#41;]");
    // The only remaining pipes are the edge-label delimiters written by the template
    expect(body).toBe(
      "graph LR\n  A[srv#124;01] -->|443| B[primary #40;east#41;]"
    );
  });
});
