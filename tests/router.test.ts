import { describe, it, expect, beforeEach, vi } from "vitest";

// Mirror the BASE computation in src/router.ts so the tests hold regardless
// of the BASE_URL vitest resolves ("/" by default).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function setupDOM(): void {
  document.body.innerHTML = `
    <nav>
      <a href="#" data-route="/">Diagrams</a>
      <a href="#" data-route="/about">About Me</a>
    </nav>
    <div id="page-diagrams" class="page"></div>
    <div id="page-about" class="page" style="display: none;"></div>
  `;
}

// router.ts queries the DOM at module load, so re-import it fresh after the
// DOM and URL for each test are in place.
async function loadRouter(): Promise<void> {
  vi.resetModules();
  const { initRouter } = await import("../src/router");
  initRouter();
}

function pageDisplay(id: string): string {
  return document.getElementById(id)!.style.display;
}

describe("initRouter 404 redirect handling", () => {
  beforeEach(() => {
    setupDOM();
  });

  it("shows the about page for a known redirected route", async () => {
    window.history.replaceState(
      null,
      "",
      `${BASE}/?route=${encodeURIComponent(BASE + "/about")}`
    );
    await loadRouter();
    expect(window.location.pathname).toBe(BASE + "/about");
    expect(pageDisplay("page-about")).toBe("");
    expect(pageDisplay("page-diagrams")).toBe("none");
  });

  it("normalizes unknown redirected routes to /", async () => {
    window.history.replaceState(
      null,
      "",
      `${BASE}/?route=${encodeURIComponent(BASE + "/docs/nonexistent")}`
    );
    await loadRouter();
    expect(window.location.pathname).toBe(BASE + "/");
    expect(window.location.search).toBe("");
    expect(pageDisplay("page-diagrams")).toBe("");
    expect(pageDisplay("page-about")).toBe("none");
  });

  it("preserves non-route query params through the redirect", async () => {
    window.history.replaceState(
      null,
      "",
      `${BASE}/?route=${encodeURIComponent(BASE + "/stale/path")}&template=my-diagram&show=true`
    );
    await loadRouter();
    const params = new URLSearchParams(window.location.search);
    expect(window.location.pathname).toBe(BASE + "/");
    expect(params.get("route")).toBeNull();
    expect(params.get("template")).toBe("my-diagram");
    expect(params.get("show")).toBe("true");
  });

  it("shows the diagrams page when there is no redirect param", async () => {
    window.history.replaceState(null, "", BASE + "/");
    await loadRouter();
    expect(pageDisplay("page-diagrams")).toBe("");
    expect(pageDisplay("page-about")).toBe("none");
  });
});
