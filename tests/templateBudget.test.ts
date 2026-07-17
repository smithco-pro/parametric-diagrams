import { describe, it, expect } from "vitest";
import {
  getTemplateSourceBytes,
  TEMPLATE_SOURCE_BUDGET_BYTES,
} from "../src/templates";

describe("template bundle budget", () => {
  it("keeps the eager .mmdx payload under budget (else migrate to lazy loading)", () => {
    const bytes = getTemplateSourceBytes();
    expect(
      bytes,
      `Eager template payload is ${(bytes / 1024).toFixed(0)} KB, over the ` +
        `${(TEMPLATE_SOURCE_BUDGET_BYTES / 1024).toFixed(0)} KB budget. Switch ` +
        `src/templates.ts import.meta.glob to lazy (remove eager:true) and load ` +
        `each template's source on selection.`
    ).toBeLessThanOrEqual(TEMPLATE_SOURCE_BUDGET_BYTES);
  });
});
