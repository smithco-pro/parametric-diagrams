# Integration Points

This page documents the public interfaces and functions in each module. These are the primary points where you can integrate with or extend the application.

## Template Engine (`src/templateEngine.ts`)

### Interfaces

```ts
interface MmdxMeta {
  name: string;
  parameters: {
    key: string;
    type: "boolean" | "number" | "string";
    label: string;
    defaultValue: boolean | number | string;
    validation?: { min?: number; max?: number };
  }[];
}

interface ParsedMmdx {
  meta: MmdxMeta;
  template: string;
}
```

### Functions

#### `parseMmdx(raw: string): ParsedMmdx`

Parses a raw `.mmdx` string into its metadata and template body. Throws if the frontmatter delimiters are missing or the JSON is invalid.

#### `compileTemplate(source: string): HandlebarsTemplateDelegate`

Compiles a Handlebars template string. Results are cached in a `Map` keyed by source string, so repeated calls with the same source return the cached delegate.

#### `executeTemplate(compiled: HandlebarsTemplateDelegate, context: Record<string, unknown>): string`

Executes a compiled template with the given context object. Performs post-processing: trims trailing whitespace per line, collapses 3+ consecutive newlines into 2, and trims the final result.

## Template Registry (`src/templates.ts`)

### Types

```ts
type ParameterDef = MmdxMeta["parameters"][number];

interface DiagramTemplate {
  name: string;
  template: string;
  compiled: HandlebarsTemplateDelegate;
  parameters: ParameterDef[];
}
```

### Exports

#### `templates: Record<string, DiagramTemplate>`

The main template registry. Keys are derived from filenames (e.g., `"network"`, `"deployment"`). Populated at module load time via `import.meta.glob`.

### Auto-Discovery Pattern

```ts
const mmdxModules = import.meta.glob<string>("./templates/*.mmdx", {
  query: "?raw",
  import: "default",
  eager: true,
});
```

This Vite feature scans the filesystem at build time and imports all matching files as raw strings. Adding a new `.mmdx` file to `src/templates/` is sufficient for it to be included.

## Renderer (`src/renderer.ts`)

### Functions

#### `renderDiagram(definition: string, container: HTMLElement): Promise<void>`

Renders a Mermaid diagram definition into the given container element. On error, displays the error message in the container. Each call generates a unique diagram ID to avoid conflicts.

#### `getSvgContent(container: HTMLElement): string | null`

Extracts the rendered SVG element from the container and serializes it to an XML string. Returns `null` if no SVG is found.

#### `exportAsPng(container: HTMLElement): Promise<void>`

Converts the rendered SVG to a PNG at 2x resolution using a canvas, then triggers a browser download. The pipeline: SVG string -> Blob URL -> Image -> Canvas (2x scale) -> PNG Blob -> download link.

### Configuration

Mermaid is initialized once at module load:

```ts
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "Fira Code, monospace",
});
```

## Parameter UI (`src/parameterUI.ts`)

### Functions

#### `renderParameterForm(container: HTMLElement, parameters: ParameterDef[], onChange: (context: Record<string, unknown>) => void, initialValues?: Record<string, unknown>): void`

Generates a form with controls for each parameter definition:
- `boolean` -> Toggle switch (hidden checkbox + styled span)
- `string` -> Text input
- `number` -> Number input with optional `min`/`max` attributes
- `select` -> Dropdown with labeled options

The optional `initialValues` argument overrides default values for form elements -- used when restoring state from URL query parameters.

The `onChange` callback fires on every `change` event (toggles, selects) and `input` event (text/number fields), receiving the current parameter values as a context object.

#### `getDefaultContext(parameters: ParameterDef[], overrides?: Record<string, unknown>): Record<string, unknown>`

Creates a context object from parameter default values. When `overrides` is provided, those values take precedence over defaults. Used for the initial render when a template is first selected, optionally with URL-supplied values.

## URL State (`src/urlState.ts`)

### Interfaces

```ts
interface UrlState {
  template: string | null;
  paramOverrides: Record<string, unknown>;
}
```

### Functions

#### `getStateFromURL(parameters?: ParameterDef[]): UrlState`

Reads the current URL query string and returns the template key and parameter overrides. When `parameters` is provided, query values are coerced to the correct types (boolean, number, string) based on the parameter definitions. Without `parameters`, only the `template` key is extracted.

#### `updateURL(templateKey: string, paramValues: Record<string, unknown>): void`

Writes the current template key and all parameter values to the URL query string using `history.replaceState`. This updates the address bar without triggering a page reload or adding a history entry, making the URL always shareable.
