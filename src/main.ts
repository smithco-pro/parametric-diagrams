import "./style.css";
import { templates } from "./templates";
import type { DiagramTemplate } from "./templates";
import { executeTemplate } from "./templateEngine";
import { renderParameterForm, getDefaultContext } from "./parameterUI";
import { renderDiagram, getSvgContent, exportAsPng } from "./renderer";
import { getStateFromURL, updateURL } from "./urlState";

const output = document.getElementById("mermaid-output") as HTMLDivElement;
const templateSelect = document.getElementById("template-select") as HTMLSelectElement;
const parametersContainer = document.getElementById("parameters") as HTMLDivElement;
const resolvedText = document.getElementById("resolved-text") as HTMLPreElement;
const renderBtn = document.getElementById("render-btn") as HTMLButtonElement;
const exportSvgBtn = document.getElementById("export-svg-btn") as HTMLButtonElement;
const exportPngBtn = document.getElementById("export-png-btn") as HTMLButtonElement;

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

function updateDiagram(context: Record<string, unknown>): void {
  if (!currentTemplate) return;
  currentMermaid = executeTemplate(currentTemplate.compiled, context);
  resolvedText.textContent = currentMermaid;
  renderDiagram(currentMermaid, output);
  updateURL(currentTemplateKey, context);
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

renderBtn.addEventListener("click", () => {
  if (currentMermaid) renderDiagram(currentMermaid, output);
});

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    if (currentMermaid) renderDiagram(currentMermaid, output);
  }
});

exportSvgBtn.addEventListener("click", () => {
  const svgContent = getSvgContent(output);
  if (!svgContent) return;

  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "appliance-diagram.svg";
  a.click();
  URL.revokeObjectURL(a.href);
});

exportPngBtn.addEventListener("click", () => {
  exportAsPng(output);
});

// Check URL for template and parameter overrides, otherwise auto-select first
const urlState = getStateFromURL();
if (urlState.template && templates[urlState.template]) {
  const paramOverrides = getStateFromURL(templates[urlState.template].parameters).paramOverrides;
  templateSelect.value = urlState.template;
  selectTemplate(urlState.template, paramOverrides);
} else if (templateSelect.options.length > 1) {
  templateSelect.value = templateSelect.options[1].value;
  selectTemplate(templateSelect.value);
}
