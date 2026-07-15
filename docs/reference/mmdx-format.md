# .mmdx File Format

The `.mmdx` (Mermaid Extended) format is a single file containing a JSON frontmatter block followed by a Handlebars-enhanced Mermaid diagram body.

## Structure

```
---
{
  "name": "Template Display Name",
  "notes": "<p>Optional HTML shown below the diagram. Port: {{portNumber}}</p>",
  "parameters": [
    { "key": "variableName", "type": "string", "label": "Human Label", "defaultValue": "default" },
    { "key": "featureToggle", "type": "boolean", "label": "Enable Feature", "defaultValue": true },
    { "key": "portNumber", "type": "number", "label": "Port", "defaultValue": 8080, "validation": { "min": 1, "max": 65535 } },
    { "key": "sizing", "type": "select", "label": "Deployment Size", "defaultValue": "small", "options": [
      { "label": "Small (2 vCPU)", "value": "small" },
      { "label": "Large (8 vCPU)", "value": "large" }
    ] }
  ]
}
---
graph TD
    A[{{variableName}}]
    {{#if featureToggle}}
    A -->|Port {{portNumber}}| B[Feature Service]
    {{/if}}
```

## Frontmatter

The JSON block between `---` delimiters defines template metadata. It is parsed by `parseMmdx()` in `src/templateEngine.ts` using a regex to extract the content between delimiters, then `JSON.parse()`.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Display name shown in the template dropdown |
| `notes` | `string` | No | Optional HTML shown below the rendered diagram (see [Template Notes](#template-notes)) |
| `parameters` | `array` | Yes | Array of parameter definitions |

### Template Notes {#template-notes}

The optional `notes` field holds an HTML fragment that is rendered into `div#template-notes` below the diagram. It is compiled as a Handlebars template, so it may reference parameter values and use the same helpers as the template body, and it re-renders on every parameter change:

```json
"notes": "<h4>Configuration</h4><p>Feature port: {{portNumber}}</p>"
```

Because the frontmatter is JSON, the entire `notes` value must be a single JSON string -- escape double quotes as `\"` and avoid raw newlines.

### Parameter Definition

Each entry in the `parameters` array has these fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | `string` | Yes | Variable name used in Handlebars expressions |
| `type` | `"string" \| "boolean" \| "number" \| "select"` | Yes | Controls the generated UI input type |
| `label` | `string` | Yes | Human-readable label shown in the form |
| `defaultValue` | `string \| boolean \| number` | Yes | Initial value when the template loads |
| `validation` | `{ min?: number, max?: number }` | No | Min/max constraints (number type only) |
| `options` | `{ label: string, value: string }[]` | No | Choices for select type (required when type is `"select"`) |
| `showWhen` | `{ key: string, value: boolean \| number \| string }` | No | Show this parameter only when another parameter matches the specified value |

### Type Behavior

| Type | UI Control | Default Handling |
|------|-----------|-----------------|
| `string` | Text input (monospace) | Used as initial input value |
| `boolean` | Toggle switch | Checked/unchecked state |
| `number` | Number input with optional min/max | Parsed as `Number()`, falls back to `0` if NaN |
| `select` | Dropdown (`<select>`) from `options` array | Option matching `defaultValue` is pre-selected |

**String sanitization:** Before the diagram body is executed, `string`-typed parameter values have Mermaid-breaking characters replaced with numeric entity codes: `|` becomes `#124;`, `(` becomes `#40;`, and `)` becomes `#41;` (`sanitizeMermaidContext()` in `src/templateEngine.ts`). Mermaid renders these entities as the literal characters, so user-typed values containing `|`, `(`, or `)` display correctly instead of breaking the diagram parse. This applies only to the diagram body -- the `notes` template renders HTML and receives the raw, unsanitized values.

### Conditional Parameters

Parameters can declare a dependency on another parameter using `showWhen`. The parameter row is hidden from the form when the condition is not met, and its `defaultValue` is used in the template context.

```json
{ "key": "rsaPort", "type": "number", "label": "RSA Port", "defaultValue": 5555,
  "showWhen": { "key": "enableRSA", "value": true } }
```

`rsaPort` only appears when `enableRSA` is `true`. When hidden, the template receives the default value `5555`.

Dependencies can be chained. If parameter B depends on A, and C depends on B, disabling A hides both B and C. Declare dependencies before their dependents in the `parameters` array.

## Template Body

Everything after the closing `---` is a Mermaid diagram definition with Handlebars expressions. The processing pipeline:

1. **Compilation** -- Handlebars compiles the template source with `noEscape: true` (special characters pass through as-is)
2. **Execution** -- The compiled template runs with the current parameter values as context (`string`-typed values are sanitized first, see [Type Behavior](#type-behavior))
3. **Cleanup** -- Trailing whitespace is trimmed per line, runs of two or more consecutive blank lines collapse to a single blank line, and the result is trimmed
4. **Rendering** -- The cleaned Mermaid source is passed to `mermaid.render()`

## File Discovery

Templates are auto-discovered at build time. Vite's `import.meta.glob` scans `src/templates/*.mmdx` and loads each file as a raw string. The filename (without path and extension) becomes the template key:

```
src/templates/my-diagram.mmdx  -->  key: "my-diagram"
src/templates/network.mmdx     -->  key: "network"
```

No manual imports or registration are needed -- just create the file and restart the dev server.

## Frontmatter Parsing

The frontmatter regex expects this exact format:

```
---\n<JSON content>\n---\n<template body>
```

The file must start with `---` followed by a newline, contain valid JSON, then have a closing `---` followed by a newline. If this pattern is not matched, `parseMmdx()` throws: `"Invalid .mmdx format: missing frontmatter delimiters"`.
