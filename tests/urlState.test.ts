import { describe, it, expect, beforeEach, vi } from "vitest";
import { getStateFromURL, updateURL } from "../src/urlState";

describe("getStateFromURL", () => {
  beforeEach(() => {
    // Reset URL to clean state
    window.history.replaceState(null, "", "/");
  });

  it("returns null template when no query params", () => {
    const state = getStateFromURL();
    expect(state.template).toBeNull();
    expect(state.paramOverrides).toEqual({});
  });

  it("reads template from query string", () => {
    window.history.replaceState(null, "", "/?template=my-diagram");
    const state = getStateFromURL();
    expect(state.template).toBe("my-diagram");
  });

  it("coerces boolean parameters", () => {
    window.history.replaceState(null, "", "/?show=true&hide=false");
    const state = getStateFromURL([
      { key: "show", type: "boolean", label: "Show", defaultValue: false },
      { key: "hide", type: "boolean", label: "Hide", defaultValue: true },
    ]);
    expect(state.paramOverrides.show).toBe(true);
    expect(state.paramOverrides.hide).toBe(false);
  });

  it("coerces number parameters", () => {
    window.history.replaceState(null, "", "/?count=42");
    const state = getStateFromURL([
      { key: "count", type: "number", label: "Count", defaultValue: 0 },
    ]);
    expect(state.paramOverrides.count).toBe(42);
  });

  it("returns 0 for invalid number parameters", () => {
    window.history.replaceState(null, "", "/?count=abc");
    const state = getStateFromURL([
      { key: "count", type: "number", label: "Count", defaultValue: 0 },
    ]);
    expect(state.paramOverrides.count).toBe(0);
  });

  it("passes string parameters through unchanged", () => {
    window.history.replaceState(null, "", "/?name=hello");
    const state = getStateFromURL([
      { key: "name", type: "string", label: "Name", defaultValue: "" },
    ]);
    expect(state.paramOverrides.name).toBe("hello");
  });

  it("ignores parameters not in definitions", () => {
    window.history.replaceState(null, "", "/?unknown=value&known=yes");
    const state = getStateFromURL([
      { key: "known", type: "string", label: "Known", defaultValue: "" },
    ]);
    expect(state.paramOverrides).toEqual({ known: "yes" });
  });
});

describe("updateURL", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("sets template and params in URL", () => {
    updateURL("my-diagram", { show: true, count: 5 });
    const params = new URLSearchParams(window.location.search);
    expect(params.get("template")).toBe("my-diagram");
    expect(params.get("show")).toBe("true");
    expect(params.get("count")).toBe("5");
  });

  it("replaces existing query params", () => {
    window.history.replaceState(null, "", "/?old=param");
    updateURL("test", { key: "val" });
    const params = new URLSearchParams(window.location.search);
    expect(params.get("old")).toBeNull();
    expect(params.get("template")).toBe("test");
  });
});
