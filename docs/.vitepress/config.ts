import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const base = "/parametric-diagrams/docs/";

export default withMermaid(
  defineConfig({
    title: "Parametric Diagrams",
    description:
      "Generate parameterized Mermaid diagrams with Handlebars templates",
    base,
    appearance: "dark",
    // head hrefs are not base-prefixed automatically, unlike themeConfig.logo
    head: [
      [
        "link",
        {
          rel: "icon",
          type: "image/svg+xml",
          href: base + "favicon.svg",
        },
      ],
    ],
    vite: {
      server: { port: 5175, strictPort: true },
    },
    themeConfig: {
      sidebar: [
        {
          text: "Guide",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Writing Templates", link: "/guide/writing-templates" },
            { text: "Example Templates", link: "/guide/example-templates" },
          ],
        },
        {
          text: "Reference",
          items: [
            { text: ".mmdx File Format", link: "/reference/mmdx-format" },
            {
              text: "Handlebars in Templates",
              link: "/reference/handlebars",
            },
            { text: "Mermaid Diagram Types", link: "/reference/mermaid" },
          ],
        },
        {
          text: "Architecture",
          items: [
            { text: "Overview", link: "/architecture/overview" },
            { text: "Extending the App", link: "/architecture/extending" },
            {
              text: "Integration Points",
              link: "/architecture/integration-points",
            },
          ],
        },
      ],
    },
  })
);
