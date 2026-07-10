import "./style.css";
import { templates } from "./templates";
import type { DiagramTemplate } from "./templates";
import { executeTemplate, sanitizeMermaidContext } from "./templateEngine";
import { renderParameterForm, getDefaultContext } from "./parameterUI";
import { renderDiagram, getSvgContent, exportAsPng } from "./renderer";
import { getStateFromURL, updateURL } from "./urlState";
import { createPanZoom } from "./panZoom";
import { initRouter } from "./router";

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

// Populate template dropdown
for (const [key, tmpl] of Object.entries(templates)) {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = tmpl.name;
  templateSelect.appendChild(option);
}

async function updateDiagram(context: Record<string, unknown>): Promise<void> {
  if (!currentTemplate) return;
  // Escape Mermaid-breaking characters in user-typed string values for the
  // diagram body only; the notes template renders HTML and gets raw values.
  const bodyContext = sanitizeMermaidContext(context, currentTemplate.parameters);
  currentMermaid = executeTemplate(currentTemplate.compiled, bodyContext);
  resolvedText.textContent = currentMermaid;
  await renderDiagram(currentMermaid, output);
  panZoom.wrap();
  updateURL(currentTemplateKey, context);

  if (currentTemplate.compiledNotes) {
    templateNotes.innerHTML = executeTemplate(currentTemplate.compiledNotes, context);
    templateNotes.style.display = "";
  } else {
    templateNotes.innerHTML = "";
    templateNotes.style.display = "none";
  }
}

function selectTemplate(
  key: string,
  paramOverrides?: Record<string, unknown>
): void {
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

initRouter();

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
