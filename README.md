# Parametric Diagrams

A client-side tool for generating parameterized Mermaid diagrams. Select a template, configure its parameters via toggle switches and input fields, and get a live-rendered diagram that updates as you change values. Export as SVG or PNG.

Built with Vite, TypeScript, Mermaid.js, and Handlebars.

## Development Setup

**Prerequisites:** Node.js (v18+)

```bash
# Install dependencies
npm install

# Start the dev server (default: http://localhost:5173)
npm run dev

# Type-check and build for production
npm run build

# Preview the production build
npm run preview
```

## Example Templates

### Network Topology (`network.mmdx`)

A top-down network diagram with an internet gateway, firewall, and load balancer feeding into application nodes backed by a database.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `lbName` | string | `Load Balancer` | Load balancer display name |
| `appNode1` | boolean | `true` | Show/hide Appliance Node 1 |
| `appNode2` | boolean | `true` | Show/hide Appliance Node 2 |
| `appNode3` | boolean | `true` | Show/hide Appliance Node 3 |
| `enableReplica` | boolean | `true` | Show/hide Replica DB |
| `enableCache` | boolean | `true` | Show/hide Redis Cache layer |

### Deployment Flow (`deployment.mmdx`)

A left-to-right CI/CD pipeline from developer commit through build, registry, and deployment stages.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `devName` | string | `Developer` | Developer node label |
| `repoName` | string | `Git Repo` | Repository node label |
| `registryName` | string | `Artifact Registry` | Registry node label |
| `enableStaging` | boolean | `true` | Include staging environment |
| `enableApproval` | boolean | `true` | Include approval/rejection gate (requires staging) |

### Sequence Diagram (`sequence.mmdx`)

A request/response sequence between client, load balancer, appliance, and database.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `clientName` | string | `Client` | Client participant name |
| `appName` | string | `Appliance` | Appliance participant name |
| `enableLB` | boolean | `true` | Include load balancer in the flow |
| `enableDB` | boolean | `true` | Include database query step |

## The `.mmdx` Template Format

Templates use the `.mmdx` (Mermaid Extended) format — a single file containing a JSON frontmatter block followed by a Handlebars-enhanced Mermaid diagram body.

### Structure

```
---
{
  "name": "Template Display Name",
  "parameters": [
    { "key": "variableName", "type": "string", "label": "Human Label", "defaultValue": "default" },
    { "key": "featureToggle", "type": "boolean", "label": "Enable Feature", "defaultValue": true },
    { "key": "portNumber", "type": "number", "label": "Port", "defaultValue": 8080, "validation": { "min": 1, "max": 65535 } }
  ]
}
---
graph TD
    A[{{variableName}}]
    {{#if featureToggle}}
    A -->|Port {{portNumber}}| B[Feature Service]
    {{/if}}
```

### Frontmatter Fields

The JSON block between `---` delimiters defines the template metadata:

- **`name`** — Display name shown in the template dropdown.
- **`parameters`** — Array of parameter definitions, each with:
  - `key` — Variable name used in the Handlebars template body.
  - `type` — One of `"string"`, `"boolean"`, or `"number"`. Controls the generated UI input.
  - `label` — Human-readable label shown next to the form control.
  - `defaultValue` — Initial value when the template is loaded.
  - `validation` *(optional, number only)* — Object with `min` and/or `max` constraints.

### Template Body

Everything after the closing `---` is a standard Mermaid diagram definition with Handlebars expressions mixed in. The template body is compiled by Handlebars before being passed to Mermaid for rendering. A cleanup pass collapses blank lines left behind by disabled `{{#if}}` blocks.

### Adding a New Template

1. Create a `.mmdx` file in `src/templates/` with the frontmatter and template body.
2. Import it in `src/templates.ts`:
   ```ts
   import myTemplateRaw from "./templates/my-template.mmdx?raw";
   ```
3. Add it to the `templates` record:
   ```ts
   export const templates: Record<string, DiagramTemplate> = {
     // ...existing templates
     myTemplate: loadTemplate(myTemplateRaw),
   };
   ```

## Writing Templates with Handlebars

The template body supports standard Handlebars syntax. The most commonly used features:

### Variable Interpolation

```handlebars
Appliance[{{applianceName}}]
```

Inserts the parameter value directly into the Mermaid output.

### Conditional Blocks

```handlebars
{{#if enableFeature}}
A --> B[Feature]
{{/if}}
```

Include or exclude diagram sections based on boolean parameters. Supports `{{else}}`:

```handlebars
{{#if enableStaging}}
Registry --> Staging
{{else}}
Registry --> Production
{{/if}}
```

### Nested Conditionals

```handlebars
{{#if enableCache}}
  {{#if appNode1}}
  App1 --> Cache[(Redis)]
  {{/if}}
{{/if}}
```

### Important Notes

- Handlebars `{{#if}}` checks **truthiness only** — it does not support comparisons like `{{#if port > 1000}}`. For complex logic, you would need to register a [custom Handlebars helper](https://handlebarsjs.com/guide/block-helpers.html).
- Disabled `{{#if}}` blocks leave blank lines in the output. The engine automatically collapses consecutive blank lines so Mermaid does not choke on unexpected whitespace.
- Handlebars does not HTML-escape output in this tool (`noEscape: true`), so special characters in string values pass through as-is.

### Handlebars Resources

- [Handlebars Guide](https://handlebarsjs.com/guide/) — Official getting started guide
- [Expressions](https://handlebarsjs.com/guide/expressions.html) — Variable interpolation and subexpressions
- [Built-in Helpers](https://handlebarsjs.com/guide/builtin-helpers.html) — `if`, `unless`, `each`, `with`, `lookup`
- [Block Helpers](https://handlebarsjs.com/guide/block-helpers.html) — Writing custom block helpers for advanced logic

### Mermaid Resources

- [Mermaid Syntax Reference](https://mermaid.js.org/intro/syntax-reference.html) — All diagram types and their syntax
- [Flowcharts](https://mermaid.js.org/syntax/flowchart.html) — `graph TD`/`graph LR` syntax used by most templates
- [Sequence Diagrams](https://mermaid.js.org/syntax/sequenceDiagram.html) — `sequenceDiagram` syntax
