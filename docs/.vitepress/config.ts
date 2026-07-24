import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

const base = "/parametric-diagrams/docs/";

export default withMermaid(
  defineConfig({
    title: "Parametric Diagrams",
    description:
      "Generate parameterized Mermaid diagrams with Handlebars templates",
    base,
    appearance: "force-dark",
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
      // Social meta, mirroring the app's index.html
      ["meta", { property: "og:title", content: "Parametric Diagrams" }],
      [
        "meta",
        {
          property: "og:description",
          content:
            "Generate customizable Mermaid diagrams from Handlebars-powered templates — live preview, shareable links, and SVG/PNG export.",
        },
      ],
      [
        "meta",
        {
          property: "og:url",
          content: "https://smithco-pro.github.io/parametric-diagrams/docs/",
        },
      ],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { name: "twitter:card", content: "summary" }],
    ],
    // The default theme preloads its bundled Inter woff2 on every page, but
    // this theme's font stack never uses Inter — drop the dead preload.
    transformHead({ head }) {
      const i = head.findIndex(
        ([tag, attrs]) =>
          tag === "link" &&
          attrs.rel === "preload" &&
          attrs.as === "font" &&
          /inter-roman-latin/.test(attrs.href ?? "")
      );
      if (i !== -1) head.splice(i, 1);
    },
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
