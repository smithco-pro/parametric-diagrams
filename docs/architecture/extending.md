# Extending the App

## Adding a New Template

Create a `.mmdx` file in `src/templates/`. That's it -- the app auto-discovers all `.mmdx` files via `import.meta.glob` at build time.

```
src/templates/my-new-diagram.mmdx
```

Restart the dev server (`npm run dev`) and your template appears in the dropdown. See [Writing Templates](/guide/writing-templates) for the full walkthrough.

## Custom Handlebars Helpers {#custom-handlebars-helpers}

Handlebars <code v-pre>{{#if}}</code> only checks truthiness. For comparisons and boolean logic, the app already ships with six helpers registered in `src/templateEngine.ts`: `eq`, `gt`, `not`, `and`, `or`, and `countTrue` -- see [Handlebars in Templates](/reference/handlebars#custom-helpers) for their signatures and usage. The existing implementations look like this:

```ts
import Handlebars from "handlebars";

// Already registered -- strict equality
Handlebars.registerHelper("eq", (a, b) => a === b);

// Already registered -- numeric greater-than
Handlebars.registerHelper("gt", (a, b) => Number(a) > Number(b));
```

To add a **new** helper (e.g. `lt` or `contains`), follow the same pattern in `src/templateEngine.ts` -- registrations at module top level run before any template is compiled:

```ts
// Numeric less-than
Handlebars.registerHelper("lt", (a, b) => Number(a) < Number(b));

// Substring check
Handlebars.registerHelper("contains", (haystack, needle) =>
  String(haystack).includes(String(needle))
);
```

Use helpers in templates as subexpressions:

```handlebars
{{#if (eq deploymentType "production")}}
A --> B[Production DB]
{{/if}}

{{#if (gt port 8000)}}
A -->|High port: {{port}}| B
{{/if}}
```

See the [Handlebars Block Helpers guide](https://handlebarsjs.com/guide/block-helpers.html) for writing block-style helpers.

## Adding a New Parameter Type

The built-in types are `string`, `boolean`, `number`, and `select`. To add another type:

1. **Update the type union** in `src/templateEngine.ts` — add the new type string to the `type` field and any extra fields it needs.

2. **Add form rendering** in `src/parameterUI.ts` inside `renderParameterForm`. Add a new branch for your type alongside the existing ones. Set `dataset.key` and `dataset.paramType` on the element.

3. **Add value extraction** in `getParameterValues` in `src/parameterUI.ts` to read the value from your new control. The selector `[data-key]` already matches any element type.

4. **Add CSS** in `src/style.css` for the new control (follow existing `.param-row` patterns).

New parameter types automatically support `showWhen` conditional visibility as long as the DOM element has `data-key` and `data-param-type` attributes set.

The `select` type is a good reference implementation — it uses `{ label, value }` objects in an `options` array:

```json
{
  "key": "sizing",
  "type": "select",
  "label": "Deployment Size",
  "defaultValue": "small",
  "options": [
    { "label": "Small (2 vCPU)", "value": "small" },
    { "label": "Large (8 vCPU)", "value": "large" }
  ]
}
```

## Mermaid Configuration {#mermaid-configuration}

Mermaid is initialized in `src/renderer.ts`:

```ts
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "Fira Code, monospace",
});
```

Common customizations:
- **Theme** -- `"default"`, `"dark"`, `"forest"`, `"neutral"`, or a custom theme object
- **Security level** -- `"strict"` disables click events, `"loose"` allows them
- **Font** -- Any CSS font-family value
- See [Mermaid configuration docs](https://mermaid.js.org/config/schema-docs/config.html) for all options

## Adding a New Export Format

Follow the pattern of `exportAsPng()` in `src/renderer.ts`:

1. Get the SVG content with `getSvgContent(container)`
2. Convert to your target format
3. Create a download link

Example skeleton for a PDF export:

```ts
export async function exportAsPdf(container: HTMLElement): Promise<void> {
  const svgContent = getSvgContent(container);
  if (!svgContent) return;

  // Convert SVG to your format...
  // Create download link...
}
```

Then wire it up in `src/main.ts` by adding a button and event listener, following the existing pattern for `exportSvgBtn` and `exportPngBtn`.

## Modifying the UI

The application layout is defined in `index.html` (two-panel layout) and styled in `src/style.css` (dark theme). Key CSS classes:

- `.editor-panel` / `.preview-panel` -- Main two-panel layout (flexbox)
- `.parameter-form` -- Parameter form container
- `.param-row` -- Individual parameter row
- `.toggle-switch` -- Boolean toggle control
- `#mermaid-output` -- Diagram render target
