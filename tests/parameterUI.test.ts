import { describe, it, expect, vi } from "vitest";
import { renderParameterForm, getDefaultContext } from "../src/parameterUI";
import type { ParameterDef } from "../src/templates";

const boolParam: ParameterDef = {
  key: "enabled",
  type: "boolean",
  label: "Enabled",
  defaultValue: true,
};

const numberParam: ParameterDef = {
  key: "count",
  type: "number",
  label: "Count",
  defaultValue: 3,
  validation: { min: 1, max: 10 },
};

const selectParam: ParameterDef = {
  key: "mode",
  type: "select",
  label: "Mode",
  defaultValue: "a",
  options: [
    { label: "Option A", value: "a" },
    { label: "Option B", value: "b" },
  ],
};

const conditionalParam: ParameterDef = {
  key: "detail",
  type: "string",
  label: "Detail",
  defaultValue: "default",
  showWhen: { key: "enabled", value: true },
};

describe("getDefaultContext", () => {
  it("returns default values for all parameters", () => {
    const ctx = getDefaultContext([boolParam, numberParam, selectParam]);
    expect(ctx).toEqual({ enabled: true, count: 3, mode: "a" });
  });

  it("applies overrides", () => {
    const ctx = getDefaultContext([boolParam, numberParam], {
      enabled: false,
      count: 7,
    });
    expect(ctx).toEqual({ enabled: false, count: 7 });
  });

  it("uses default when override key is missing", () => {
    const ctx = getDefaultContext([boolParam, numberParam], { count: 5 });
    expect(ctx).toEqual({ enabled: true, count: 5 });
  });
});

describe("renderParameterForm", () => {
  function createContainer(): HTMLElement {
    return document.createElement("div");
  }

  it("shows message for empty parameters", () => {
    const container = createContainer();
    renderParameterForm(container, [], vi.fn());
    expect(container.innerHTML).toContain("No configurable parameters");
  });

  it("renders boolean parameter as checkbox", () => {
    const container = createContainer();
    renderParameterForm(container, [boolParam], vi.fn());
    const input = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    expect(input).not.toBeNull();
    expect(input!.checked).toBe(true);
  });

  it("renders number parameter with min/max", () => {
    const container = createContainer();
    renderParameterForm(container, [numberParam], vi.fn());
    const input = container.querySelector<HTMLInputElement>(
      'input[type="number"]'
    );
    expect(input).not.toBeNull();
    expect(input!.value).toBe("3");
    expect(input!.min).toBe("1");
    expect(input!.max).toBe("10");
  });

  it("renders select parameter with options", () => {
    const container = createContainer();
    renderParameterForm(container, [selectParam], vi.fn());
    const select = container.querySelector("select");
    expect(select).not.toBeNull();
    const options = select!.querySelectorAll("option");
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toBe("Option A");
  });

  it("applies initial values", () => {
    const container = createContainer();
    renderParameterForm(container, [boolParam], vi.fn(), { enabled: false });
    const input = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    expect(input!.checked).toBe(false);
  });

  it("calls onChange when input changes", () => {
    const container = createContainer();
    const onChange = vi.fn();
    renderParameterForm(container, [numberParam], onChange);
    const input = container.querySelector<HTMLInputElement>(
      'input[type="number"]'
    );
    input!.value = "7";
    input!.dispatchEvent(new Event("input", { bubbles: true }));
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0].count).toBe(7);
  });

  it("hides conditional parameter when dependency is false", () => {
    const container = createContainer();
    renderParameterForm(
      container,
      [boolParam, conditionalParam],
      vi.fn(),
      { enabled: false }
    );
    const detailRow = container.querySelector('[data-param-key="detail"]');
    expect(detailRow!.classList.contains("hidden")).toBe(true);
  });

  it("shows conditional parameter when dependency matches", () => {
    const container = createContainer();
    renderParameterForm(
      container,
      [boolParam, conditionalParam],
      vi.fn(),
      { enabled: true }
    );
    const detailRow = container.querySelector('[data-param-key="detail"]');
    expect(detailRow!.classList.contains("hidden")).toBe(false);
  });
});
