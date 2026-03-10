import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "Fira Code, monospace",
});

let renderCounter = 0;

export async function renderDiagram(
  definition: string,
  container: HTMLElement
): Promise<void> {
  container.innerHTML = "";

  try {
    const id = `mermaid-diagram-${renderCounter++}`;
    const { svg } = await mermaid.render(id, definition.trim());
    container.innerHTML = svg;
  } catch (error) {
    container.innerHTML = `<pre style="color: #e94560;">Error rendering diagram:\n${
      error instanceof Error ? error.message : String(error)
    }</pre>`;
  }
}

export function getSvgContent(container: HTMLElement): string | null {
  const svg = container.querySelector("svg");
  if (!svg) return null;
  return new XMLSerializer().serializeToString(svg);
}

export async function exportAsPng(container: HTMLElement): Promise<void> {
  const svg = container.querySelector("svg");
  if (!svg) return;

  const bbox = svg.getBBox();
  const width = bbox.width || svg.getBoundingClientRect().width;
  const height = bbox.height || svg.getBoundingClientRect().height;

  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute("width", `${width}`);
  clonedSvg.setAttribute("height", `${height}`);
  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  // Inline computed styles so they survive the <img> isolation boundary
  // (Chrome/Safari strip styles when rendering SVG in <img>)
  const originalElements = svg.querySelectorAll("*");
  const clonedElements = clonedSvg.querySelectorAll("*");
  for (let i = 0; i < originalElements.length; i++) {
    const computed = getComputedStyle(originalElements[i]);
    (clonedElements[i] as HTMLElement | SVGElement).setAttribute(
      "style",
      computed.cssText
    );
  }

  const svgContent = new XMLSerializer().serializeToString(clonedSvg);
  // Use base64 data URL instead of blob URL for cross-browser compatibility
  const encoder = new TextEncoder();
  const bytes = encoder.encode(svgContent);
  const base64 = btoa(String.fromCharCode(...bytes));
  const dataUrl = `data:image/svg+xml;base64,${base64}`;

  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    const scale = 3;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "appliance-diagram.png";
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  img.onerror = () => {
    console.error("Failed to load SVG for PNG export");
  };

  img.src = dataUrl;
}
