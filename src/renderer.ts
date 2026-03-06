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
  const svgContent = getSvgContent(container);
  if (!svgContent) return;

  const svgBlob = new Blob([svgContent], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
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
