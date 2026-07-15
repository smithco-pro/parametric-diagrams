import { describe, it, expect } from "vitest";
import {
  compileTemplate,
  escapeHtmlValue,
  executeTemplate,
  sanitizeMermaidContext,
  sanitizeMermaidLabelValue,
  sanitizeNotesContext,
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

describe("escapeHtmlValue", () => {
  it("escapes all five HTML metacharacters", () => {
    expect(escapeHtmlValue(`& < > " '`)).toBe(
      "&amp; &lt; &gt; &quot; &#39;"
    );
  });

  it("leaves safe strings untouched", () => {
    expect(escapeHtmlValue("uag.example.com")).toBe("uag.example.com");
  });
});

describe("sanitizeNotesContext", () => {
  // Notes templates are compiled with noEscape and their output is assigned
  // to innerHTML, so these tests execute a notes-style template exactly the
  // way main.ts does and inspect the resulting HTML string.
  const notesTemplate = compileTemplate(
    '<div class="notes"><b>Server:</b> {{serverName}}{{#if comment}} — <i>{{comment}}</i>{{/if}}</div>'
  );

  it("neutralizes a script-tag payload in a string param", () => {
    const hostile = {
      serverName: "<script>alert(1)</script>",
      comment: "",
    };
    const html = executeTemplate(
      notesTemplate,
      sanitizeNotesContext(hostile, parameters)
    );

    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("neutralizes an onerror-attribute payload arriving as a URL param value", () => {
    // Simulates ?serverName=<img src=x onerror=alert(document.domain)> from
    // a shared link: urlState.coerceValue passes string params through raw.
    const hostile = {
      serverName: '<img src=x onerror="alert(document.domain)">',
      comment: "'/><svg onload=alert(1)>",
    };
    const html = executeTemplate(
      notesTemplate,
      sanitizeNotesContext(hostile, parameters)
    );

    expect(html).not.toContain("<img");
    expect(html).not.toContain("<svg");
    expect(html).toContain(
      "&lt;img src=x onerror=&quot;alert(document.domain)&quot;&gt;"
    );
    expect(html).toContain("&#39;/&gt;&lt;svg onload=alert(1)&gt;");
  });

  it("keeps template-author HTML markup working", () => {
    const html = executeTemplate(
      notesTemplate,
      sanitizeNotesContext(
        { serverName: "srv01", comment: "primary" },
        parameters
      )
    );

    expect(html).toBe(
      '<div class="notes"><b>Server:</b> srv01 — <i>primary</i></div>'
    );
  });

  it("does not touch non-string-typed parameters", () => {
    const context = {
      serverName: "ok",
      comment: "",
      showComment: true,
      nodeCount: 2,
      size: "small (default)",
    };
    const sanitized = sanitizeNotesContext(context, parameters);

    expect(sanitized.showComment).toBe(true);
    expect(sanitized.nodeCount).toBe(2);
    expect(sanitized.size).toBe("small (default)");
  });

  it("does not mutate the original context (body path needs the raw value)", () => {
    const context = { serverName: '<b>"raw"</b>' };
    const sanitized = sanitizeNotesContext(context, parameters);

    expect(context.serverName).toBe('<b>"raw"</b>');
    expect(sanitized).not.toBe(context);
  });

  it("leaves the Mermaid body path unchanged for the same raw input", () => {
    // Both sanitizers take the RAW user value; the body path must keep using
    // Mermaid numeric entities, not HTML entities (and vice versa).
    const raw = { serverName: '<img src=x onerror=alert("1")|>', comment: "" };
    const forBody = sanitizeMermaidContext(raw, parameters);
    const forNotes = sanitizeNotesContext(raw, parameters);

    expect(forBody.serverName).toBe(
      "<img src=x onerror=alert#40;#34;1#34;#41;#124;>"
    );
    expect(forNotes.serverName).toBe(
      "&lt;img src=x onerror=alert(&quot;1&quot;)|&gt;"
    );
    // No cross-contamination: no HTML entities in the body value, no Mermaid
    // numeric entities in the notes value.
    expect(forBody.serverName).not.toContain("&lt;");
    expect(forNotes.serverName).not.toContain("#40;");
  });
});
