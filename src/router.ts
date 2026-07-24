const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const pages = document.querySelectorAll<HTMLElement>(".page");
const navLinks = document.querySelectorAll<HTMLAnchorElement>("nav a[data-route]");

// Known client-side routes → the page element they reveal. Unknown routes fall
// back to the diagrams page. Add a route here and both showPage and the
// 404-redirect normalizer pick it up. A Map (not an object literal) so a route
// string that collides with an Object.prototype key — e.g. a bogus redirect
// ?route=toString — is not mistaken for a known route.
const DEFAULT_PAGE_ID = "page-diagrams";
const ROUTES = new Map<string, string>([
  ["/", DEFAULT_PAGE_ID],
  ["/about", "page-about"],
]);

function isKnownRoute(route: string): boolean {
  return ROUTES.has(route);
}

function pageIdForRoute(route: string): string {
  return ROUTES.get(route) ?? DEFAULT_PAGE_ID;
}

export function getRoute(): string {
  const path = window.location.pathname;
  return path.startsWith(BASE) ? path.slice(BASE.length) || "/" : "/";
}

function showPage(route: string): void {
  const pageId = pageIdForRoute(route);

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

// onNavigate fires after the user moves between routes (nav click or
// history back/forward) — not on the initial page load, whose route the
// caller can read itself via getRoute().
export function initRouter(onNavigate?: (route: string) => void): void {
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
      onNavigate?.(route);
    });
  });

  window.addEventListener("popstate", () => {
    const route = getRoute();
    showPage(route);
    onNavigate?.(route);
  });

  // Handle redirect from 404.html on GitHub Pages
  const searchParams = new URLSearchParams(window.location.search);
  const redirectRoute = searchParams.get("route");
  if (redirectRoute) {
    const route = redirectRoute.startsWith(BASE)
      ? redirectRoute.slice(BASE.length) || "/"
      : redirectRoute;
    // Normalize unknown paths to "/" so the address bar matches what is shown
    const known = isKnownRoute(route) ? route : "/";
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
