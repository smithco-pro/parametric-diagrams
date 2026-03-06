# Getting Started

## Prerequisites

- Node.js v18+

## Installation

```bash
git clone <repo-url>
cd parametric-diagrams
npm install
```

## Development

```bash
# Start the dev server (default: http://localhost:5173)
npm run dev

# Type-check and build for production
npm run build

# Preview the production build
npm run preview
```

## Documentation Site

```bash
# Start the docs dev server
npm run docs:dev

# Build the docs for production
npm run docs:build

# Preview the built docs
npm run docs:preview
```

## Project Structure

```
src/
  main.ts              # App entry point and event handling
  templates.ts         # Template loader and registry (auto-discovery)
  templateEngine.ts    # .mmdx parser, Handlebars compiler, executor
  renderer.ts          # Mermaid rendering and SVG/PNG export
  parameterUI.ts       # Parameter form UI generation
  style.css            # Application styling
  templates/           # .mmdx template files (auto-discovered)
```

## How It Works

1. Select a template from the dropdown
2. Configure parameters using the generated form controls
3. The diagram re-renders live as you change values
4. Export as SVG or PNG when you're happy with the result

Templates are `.mmdx` files -- Mermaid diagrams with Handlebars expressions and a JSON frontmatter block defining parameters. See the [.mmdx Format Reference](/reference/mmdx-format) for details.
