import { describe, it, expect, beforeEach } from "vitest";
import { clamp, PanZoomController } from "../src/panZoom";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to minimum", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to maximum", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles equal min and max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe("PanZoomController", () => {
  let container: HTMLDivElement;
  let parent: HTMLDivElement;

  beforeEach(() => {
    parent = document.createElement("div");
    container = document.createElement("div");
    parent.appendChild(container);
    document.body.appendChild(parent);
  });

  it("creates zoom controls", () => {
    new PanZoomController(container);
    const controls = parent.querySelector(".zoom-controls");
    expect(controls).not.toBeNull();
    expect(controls!.querySelectorAll("button")).toHaveLength(3);
  });

  it("displays initial zoom level as 100%", () => {
    new PanZoomController(container);
    const label = parent.querySelector(".zoom-level");
    expect(label!.textContent).toBe("100%");
  });

  it("reset restores zoom to 100%", () => {
    const controller = new PanZoomController(container);
    // Simulate some zoom change by calling reset
    controller.reset();
    const label = parent.querySelector(".zoom-level");
    expect(label!.textContent).toBe("100%");
  });

  it("wrap wraps SVG in pan-zoom-wrapper", () => {
    const controller = new PanZoomController(container);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svg);
    controller.wrap();
    const wrapper = container.querySelector(".pan-zoom-wrapper");
    expect(wrapper).not.toBeNull();
    expect(wrapper!.contains(svg)).toBe(true);
  });

  it("wrap is idempotent when SVG is already wrapped", () => {
    const controller = new PanZoomController(container);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svg);
    controller.wrap();
    controller.wrap();
    const wrappers = container.querySelectorAll(".pan-zoom-wrapper");
    expect(wrappers).toHaveLength(1);
  });
});
