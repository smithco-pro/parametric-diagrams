const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const pages = document.querySelectorAll<HTMLElement>(".page");
const navLinks = document.querySelectorAll<HTMLAnchorElement>("nav a[data-route]");

function getRoute(): string {
  const path = window.location.pathname;
  return path.startsWith(BASE) ? path.slice(BASE.length) || "/" : "/";
}

function showPage(route: string): void {
  const pageId = route === "/about" ? "page-about" : "page-diagrams";

  pages.forEach((page) => {
    page.style.display = page.id === pageId ? "" : "none";
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("data-route") === route);
  });
}

const DOCS_URL = import.meta.env.DEV
  ? "http://localhost:5175/parametric-diagrams/docs/" // For development, point to the docs in the concurrent Vite server
  : BASE + "/docs/";

export function initRouter(): void {
  // Handle docs link via click to avoid query param leakage
  const docsLink = document.querySelector<HTMLAnchorElement>(
    'nav a[data-docs]'
  );
  if (docsLink) {
    docsLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = DOCS_URL;
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const route = link.getAttribute("data-route");
      if (!route) return;

      e.preventDefault();
      history.pushState(null, "", BASE + route);
      showPage(route);
    });
  });

  window.addEventListener("popstate", () => {
    showPage(getRoute());
  });

  // Handle redirect from 404.html on GitHub Pages
  const searchParams = new URLSearchParams(window.location.search);
  const redirectRoute = searchParams.get("route");
  if (redirectRoute) {
    const route = redirectRoute.startsWith(BASE)
      ? redirectRoute.slice(BASE.length) || "/"
      : redirectRoute;
    // Normalize unknown paths to "/" so the address bar matches what is shown
    const known = route === "/about" ? route : "/";
    // Preserve remaining query params (template key, parameter overrides) so
    // urlState.ts can still read them after the URL rewrite
    searchParams.delete("route");
    const qs = searchParams.toString();
    history.replaceState(null, "", BASE + known + (qs ? "?" + qs : ""));
    showPage(known);
  } else {
    showPage(getRoute());
  }
}
