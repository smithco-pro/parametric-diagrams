import "./style.css";
import { templates } from "./templates";
import type { DiagramTemplate } from "./templates";
import {
  executeTemplate,
  sanitizeMermaidContext,
  sanitizeNotesContext,
} from "./templateEngine";
import { renderParameterForm, getDefaultContext } from "./parameterUI";
import { renderDiagram, getSvgContent, exportAsPng } from "./renderer";
import { getStateFromURL, updateURL } from "./urlState";
import { createPanZoom } from "./panZoom";
import { initRouter, getRoute } from "./router";

const output = document.getElementById("mermaid-output") as HTMLDivElement;
const templateSelect = document.getElementById("template-select") as HTMLSelectElement;
const parametersContainer = document.getElementById("parameters") as HTMLDivElement;
const resolvedText = document.getElementById("resolved-text") as HTMLPreElement;
const templateNotes = document.getElementById("template-notes") as HTMLDivElement;
const renderBtn = document.getElementById("render-btn") as HTMLButtonElement;
const exportSvgBtn = document.getElementById("export-svg-btn") as HTMLButtonElement;
const exportPngBtn = document.getElementById("export-png-btn") as HTMLButtonElement;

const panZoom = createPanZoom(output);

let currentTemplate: DiagramTemplate | null = null;
let currentTemplateKey = "";
let currentMermaid = "";
// Last full parameter context, kept so the URL can be re-synced when the user
// navigates back to the diagrams route (whose pushState drops the query).
let currentContext: Record<string, unknown> | null = null;
// Last values actually pushed to the DOM, so a parameter change that leaves the
// output unchanged can skip the expensive Mermaid render / notes rebuild.
// Reset on every template switch (in selectTemplate) to force the first render.
let lastRenderedMermaid: string | null = null;
let lastRenderedNotes: string | null | undefined = undefined;

// Populate template dropdown
for (const [key, tmpl] of Object.entries(templates)) {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = tmpl.name;
  templateSelect.appendChild(option);
}

async function updateDiagram(context: Record<string, unknown>): Promise<void> {
  if (!currentTemplate) return;
  // Each render path escapes user-typed string values from the raw context:
  // Mermaid-breaking characters for the diagram body, HTML metacharacters for
  // the notes template (whose output is assigned to innerHTML below).
  const bodyContext = sanitizeMermaidContext(context, currentTemplate.parameters);
  currentMermaid = executeTemplate(currentTemplate.compiled, bodyContext);
  resolvedText.textContent = currentMermaid;

  // Skip the expensive Mermaid parse + layout when the diagram source is
  // byte-identical to what is already rendered (e.g. toggling a parameter that
  // only affects the notes panel).
  if (currentMermaid !== lastRenderedMermaid) {
    lastRenderedMermaid = currentMermaid;
    await renderDiagram(currentMermaid, output);
    panZoom.wrap();
  }

  currentContext = context;
  // Only the diagrams route owns the template query string — writing it on
  // /about would leak diagram state into shared About links.
  if (getRoute() === "/") updateURL(currentTemplateKey, context);

  const notesHtml = currentTemplate.compiledNotes
    ? executeTemplate(
        currentTemplate.compiledNotes,
        sanitizeNotesContext(context, currentTemplate.parameters)
      )
    : null;
  // Only rebuild the notes DOM subtree when its rendered HTML actually changed.
  if (notesHtml !== lastRenderedNotes) {
    lastRenderedNotes = notesHtml;
    templateNotes.innerHTML = notesHtml ?? "";
    templateNotes.style.display = notesHtml === null ? "none" : "";
  }
}

function selectTemplate(
  key: string,
  paramOverrides?: Record<string, unknown>
): void {
  // A new template's output must never be suppressed by the previous
  // template's render guards.
  lastRenderedMermaid = null;
  lastRenderedNotes = undefined;
  const tmpl = templates[key];
  if (!tmpl) {
    currentTemplate = null;
    currentTemplateKey = "";
    parametersContainer.innerHTML = "";
    resolvedText.textContent = "";
    output.innerHTML = "";
    return;
  }

  currentTemplate = tmpl;
  currentTemplateKey = key;
  panZoom.reset();
  renderParameterForm(
    parametersContainer,
    tmpl.parameters,
    updateDiagram,
    paramOverrides
  );
  updateDiagram(getDefaultContext(tmpl.parameters, paramOverrides));
}

templateSelect.addEventListener("change", () => {
  selectTemplate(templateSelect.value);
});

renderBtn.addEventListener("click", async () => {
  if (currentMermaid) {
    await renderDiagram(currentMermaid, output);
    panZoom.wrap();
  }
});

document.addEventListener("keydown", async (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    if (currentMermaid) {
      await renderDiagram(currentMermaid, output);
      panZoom.wrap();
    }
  }
});

exportSvgBtn.addEventListener("click", () => {
  const svgContent = getSvgContent(output);
  if (!svgContent) return;

  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${currentTemplateKey || "diagram"}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
});

exportPngBtn.addEventListener("click", () => {
  exportAsPng(output, currentTemplateKey || "diagram");
});

initRouter((route) => {
  if (route === "/" && currentTemplateKey && currentContext) {
    updateURL(currentTemplateKey, currentContext);
  }
});

// Check URL for template and parameter overrides, otherwise auto-select the
// featured default template (falling back to the first available template)
const DEFAULT_TEMPLATE = "omnissa-access-connector-network";
const urlState = getStateFromURL();
if (urlState.template && templates[urlState.template]) {
  const paramOverrides = getStateFromURL(templates[urlState.template].parameters).paramOverrides;
  templateSelect.value = urlState.template;
  selectTemplate(urlState.template, paramOverrides);
} else {
  const fallback = templateSelect.options[1]?.value ?? "";
  templateSelect.value = templates[DEFAULT_TEMPLATE] ? DEFAULT_TEMPLATE : fallback;
  if (templateSelect.value) selectTemplate(templateSelect.value);
}
