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

  const bbox = svg.getBoundingClientRect();
  const width = bbox.width;
  const height = bbox.height;

  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute("width", `${width}`);
  clonedSvg.setAttribute("height", `${height}`);

  const svgContent = new XMLSerializer().serializeToString(clonedSvg);
  const svgBlob = new Blob([svgContent], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const scale = 3;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "appliance-diagram.png";
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  img.src = url;
}
