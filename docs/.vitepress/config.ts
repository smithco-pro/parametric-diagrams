import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(
  defineConfig({
    title: "Parametric Diagrams",
    description:
      "Generate parameterized Mermaid diagrams with Handlebars templates",
    base: "/parametric-diagrams/docs/",
    themeConfig: {
      nav: [
        { text: "Guide", link: "/guide/getting-started" },
        { text: "Reference", link: "/reference/mmdx-format" },
        { text: "Architecture", link: "/architecture/overview" },
      ],
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
