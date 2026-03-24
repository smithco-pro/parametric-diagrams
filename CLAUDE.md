# Parametric Diagrams

Browser-based app for generating customizable Mermaid diagrams using Handlebars templating. Users select a template, adjust parameters via form controls, and get live-rendered diagrams with SVG/PNG export.

## Tech Stack

- **App:** Vanilla TypeScript, Vite, Handlebars.js, Mermaid.js
- **Docs:** VitePress with Mermaid plugin
- **Testing:** Vitest
- **Styling:** Plain CSS (dark theme)

## Commands

- `npm run dev` — Start app (port 5173) + docs (port 5175) concurrently
- `npm run build` — Type-check with tsc then Vite build
- `npm test` — Run Vitest
- `npm run docs:dev` — Docs dev server only
- `npm run docs:build` — Build docs for production

## Project Structure

```
src/
├── main.ts            # Entry point, wires UI/templates/rendering
├── templates.ts       # Template registry (auto-discovers .mmdx via import.meta.glob)
├── templateEngine.ts  # MMDX parser, Handlebars compiler, custom helpers
├── parameterUI.ts     # Form generation from parameter definitions
├── renderer.ts        # Mermaid rendering + SVG/PNG export
├── urlState.ts        # URL query parameter state sync
├── panZoom.ts         # Pan/zoom controller (mouse, touch, keyboard)
├── router.ts          # Client-side SPA router (/, /about)
├── style.css          # Dark theme styles
└── templates/         # .mmdx template files (auto-discovered)

docs/                  # VitePress documentation
├── guide/             # Getting started, writing templates, examples
├── reference/         # .mmdx format spec, Handlebars syntax, Mermaid types
└── architecture/      # Module overview, extending the app, integration points
```

## .mmdx Template Format

Templates use `.mmdx` (Mermaid Extended) — JSON frontmatter + Handlebars-templated Mermaid body:

```
---
{
  "name": "Template Name",
  "notes": "<optional HTML notes>",
  "parameters": [
    { "key": "foo", "label": "Foo", "type": "boolean", "defaultValue": true },
    { "key": "bar", "label": "Bar", "type": "select", "options": [...], "defaultValue": "x" },
    { "key": "baz", "label": "Baz", "type": "string", "defaultValue": "hello", "showWhen": { "key": "foo", "value": true } }
  ]
}
---
graph LR
  A[{{foo}}] --> B
  {{#if bar}}B --> C{{/if}}
```

**Parameter types:** `string`, `boolean`, `number`, `select`
**Conditional visibility:** `showWhen: { key, value }` hides params based on other param values
**Auto-discovery:** Drop a `.mmdx` file in `src/templates/` — no manual registration needed.

## Custom Handlebars Helpers

Registered in `templateEngine.ts`: `eq`, `gt`, `not`, `and`, `or`, `countTrue`

## Key Architecture Notes

- **Template compilation** is cached in a Map to avoid recompiling
- **Blank line collapsing** cleans up disabled `{{#if}}` blocks to prevent Mermaid parse errors
- **URL state** syncs template key + params to query string via `history.replaceState` for shareable links
- **PNG export** renders at 3x scale for crisp output
- **Build base path:** `/parametric-diagrams/` (configured in vite.config.ts)

## Further Reading

- `docs/reference/mmdx-format.md` — Full .mmdx file format specification
- `docs/reference/handlebars.md` — Handlebars syntax and helper usage in templates
- `docs/reference/mermaid.md` — Supported Mermaid diagram types
- `docs/architecture/extending.md` — How to add templates, helpers, and features
