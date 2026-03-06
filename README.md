# Parametric Diagrams

A client-side tool for generating parameterized Mermaid diagrams using Handlebars templates. Select a template, configure parameters, and get a live-rendered diagram. Export as SVG or PNG.

Built with Vite, TypeScript, Mermaid.js, and Handlebars.

## Quick Start

**Prerequisites:** Node.js (v18+)

```bash
npm install
npm run dev
```

## Documentation

Full documentation is available via the docs site (run `npm run docs:dev` locally):

- [Getting Started](docs/guide/getting-started.md) -- Setup, project structure, and usage
- [Writing Templates](docs/guide/writing-templates.md) -- Create new `.mmdx` templates
- [.mmdx Format Reference](docs/reference/mmdx-format.md) -- Complete file format specification
- [Handlebars in Templates](docs/reference/handlebars.md) -- Template syntax reference
- [Architecture Overview](docs/architecture/overview.md) -- Module diagram and data flow
- [Extending the App](docs/architecture/extending.md) -- Add templates, helpers, parameter types, and export formats
- [Integration Points](docs/architecture/integration-points.md) -- Public API surface of each module
