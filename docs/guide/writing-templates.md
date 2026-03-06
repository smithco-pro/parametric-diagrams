# Writing Templates

This guide walks through creating a new `.mmdx` template from scratch.

## 1. Create the File

Create a new `.mmdx` file in `src/templates/`. The filename becomes the template key (e.g., `my-diagram.mmdx` becomes `my-diagram`).

```
src/templates/my-diagram.mmdx
```

Templates are **auto-discovered** -- the app uses Vite's `import.meta.glob` to find all `.mmdx` files in `src/templates/` at build time. No manual registration is needed.

## 2. Write the Frontmatter

Start with JSON frontmatter between `---` delimiters. Define a display name and parameter array:

```
---
{
  "name": "My Diagram",
  "parameters": [
    { "key": "title", "type": "string", "label": "Diagram Title", "defaultValue": "My Service" },
    { "key": "enableDB", "type": "boolean", "label": "Include Database", "defaultValue": true },
    { "key": "port", "type": "number", "label": "Service Port", "defaultValue": 8080, "validation": { "min": 1, "max": 65535 } }
  ]
}
---
```

### Parameter Types

| Type | UI Control | Value |
|------|-----------|-------|
| `string` | Text input | String value |
| `boolean` | Toggle switch | `true` / `false` |
| `number` | Number input | Numeric value, optional `min`/`max` validation |

## 3. Write the Diagram Body

After the closing `---`, write standard Mermaid syntax with Handlebars expressions:

```handlebars
graph TD
    A[{{title}}] -->|Port {{port}}| B[API Gateway]
    {{#if enableDB}}
    B --> C[(Database)]
    {{/if}}
```

### Variable Interpolation

Use <code v-pre>{{parameterKey}}</code> to insert parameter values:

```handlebars
A[{{title}}]
```

### Conditional Sections

Use <code v-pre>{{#if}}</code> / <code v-pre>{{/if}}</code> to conditionally include diagram sections:

```handlebars
{{#if enableDB}}
B --> C[(Database)]
{{/if}}
```

You can nest conditionals:

```handlebars
{{#if enableCache}}
  {{#if enableDB}}
  Cache --> DB
  {{/if}}
{{/if}}
```

## 4. Conditional Parameters

Use `showWhen` to show a parameter only when another parameter has a specific value. This keeps the form clean by hiding irrelevant options.

```json
{
  "parameters": [
    { "key": "enableAuth", "type": "boolean", "label": "Enable Auth", "defaultValue": false },
    { "key": "authProvider", "type": "select", "label": "Auth Provider", "defaultValue": "oauth",
      "options": [
        { "label": "OAuth 2.0", "value": "oauth" },
        { "label": "SAML", "value": "saml" }
      ],
      "showWhen": { "key": "enableAuth", "value": true }
    }
  ]
}
```

When `enableAuth` is `false`, the `authProvider` select is hidden and its `defaultValue` (`"oauth"`) is passed to the template.

### Chained Dependencies

Dependencies can be chained — if a parent is hidden, all its dependents are hidden too:

```json
{ "key": "enableVirtualApp", "type": "boolean", "label": "Virtual App Service", "defaultValue": true },
{ "key": "enableCitrix", "type": "boolean", "label": "Citrix Integration", "defaultValue": false,
  "showWhen": { "key": "enableVirtualApp", "value": true } },
{ "key": "citrixPort", "type": "number", "label": "Citrix Port", "defaultValue": 443,
  "showWhen": { "key": "enableCitrix", "value": true } }
```

Disabling `enableVirtualApp` hides both `enableCitrix` and `citrixPort`. Declare dependencies before dependents in the array.

## 5. Test It

Run `npm run dev` and select your new template from the dropdown. It appears automatically -- no code changes required.

## Complete Example

```
---
{
  "name": "Simple Service",
  "parameters": [
    { "key": "serviceName", "type": "string", "label": "Service Name", "defaultValue": "My Service" },
    { "key": "enableAuth", "type": "boolean", "label": "Enable Auth", "defaultValue": true },
    { "key": "enableDB", "type": "boolean", "label": "Enable Database", "defaultValue": true }
  ]
}
---
graph LR
    Client --> {{#if enableAuth}}Auth[Auth Service] --> {{/if}}App[{{serviceName}}]
    {{#if enableDB}}
    App --> DB[(PostgreSQL)]
    {{/if}}
```

## Tips

- Blank lines left by disabled <code v-pre>{{#if}}</code> blocks are automatically collapsed
- Handlebars does not HTML-escape output (`noEscape: true`), so special characters pass through as-is
- <code v-pre>{{#if}}</code> only checks truthiness -- it cannot do comparisons like <code v-pre>{{#if port > 1000}}</code>
- For complex logic, register a [custom Handlebars helper](/architecture/extending#custom-handlebars-helpers)
