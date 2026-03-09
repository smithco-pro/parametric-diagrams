import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock mermaid before importing renderer
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

import mermaid from "mermaid";
import { renderDiagram, getSvgContent } from "../src/renderer";

describe("getSvgContent", () => {
  it("returns null when no SVG present", () => {
    const container = document.createElement("div");
    expect(getSvgContent(container)).toBeNull();
  });

  it("returns serialized SVG string", () => {
    const container = document.createElement("div");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100");
    container.appendChild(svg);
    const result = getSvgContent(container);
    expect(result).toContain("<svg");
    expect(result).toContain('width="100"');
  });
});

describe("renderDiagram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders SVG into container on success", async () => {
    const container = document.createElement("div");
    vi.mocked(mermaid.render).mockResolvedValue({
      svg: '<svg id="test"><rect/></svg>',
      diagramType: "flowchart",
      bindFunctions: undefined,
    });

    await renderDiagram("graph TD\n  A --> B", container);
    expect(container.innerHTML).toContain("<svg");
  });

  it("shows error message on render failure", async () => {
    const container = document.createElement("div");
    vi.mocked(mermaid.render).mockRejectedValue(new Error("Parse error"));

    await renderDiagram("invalid diagram", container);
    expect(container.innerHTML).toContain("Error rendering diagram");
    expect(container.innerHTML).toContain("Parse error");
  });

  it("clears container before rendering", async () => {
    const container = document.createElement("div");
    container.innerHTML = "<p>old content</p>";
    vi.mocked(mermaid.render).mockResolvedValue({
      svg: "<svg></svg>",
      diagramType: "flowchart",
      bindFunctions: undefined,
    });

    await renderDiagram("graph TD\n  A", container);
    expect(container.innerHTML).not.toContain("old content");
  });
});
