# Parametric Diagrams

**Live demo:** [smithco-pro.github.io/parametric-diagrams](https://smithco-pro.github.io/parametric-diagrams/)

A client-side tool for generating parameterized Mermaid diagrams using Handlebars templates. Select a template, configure parameters, and get a live-rendered diagram. Export as SVG or PNG.

> **Heads up:** This is a personal community project — it is not an official Omnissa product, and it is not supported or endorsed by Omnissa. Please verify any port or sizing information against the [official Omnissa documentation](https://docs.omnissa.com/) before deploying.

Built with Vite, TypeScript, Mermaid.js, and Handlebars.

## Quick Start

**Prerequisites:** Node.js 20.19+ or 22.12+ (required by Vite 7); Node 22 LTS recommended

```bash
npm install
npm run dev
```

## Documentation

Full documentation is available on the [hosted docs site](https://smithco-pro.github.io/parametric-diagrams/docs/) (or run `npm run docs:dev` locally):

- [Getting Started](docs/guide/getting-started.md) -- Setup, project structure, and usage
- [Writing Templates](docs/guide/writing-templates.md) -- Create new `.mmdx` templates
- [.mmdx Format Reference](docs/reference/mmdx-format.md) -- Complete file format specification
- [Handlebars in Templates](docs/reference/handlebars.md) -- Template syntax reference
- [Architecture Overview](docs/architecture/overview.md) -- Module diagram and data flow
- [Extending the App](docs/architecture/extending.md) -- Add templates, helpers, parameter types, and export formats
- [Integration Points](docs/architecture/integration-points.md) -- Public API surface of each module

## License

MIT
