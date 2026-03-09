const MIN_SCALE = 0.1;
const MAX_SCALE = 5.0;
const ZOOM_FACTOR = 1.2;

interface PanZoomState {
  scale: number;
  x: number;
  y: number;
}

export class PanZoomController {
  private state: PanZoomState = { scale: 1, x: 0, y: 0 };
  private wrapper: HTMLDivElement | null = null;
  private controlsEl: HTMLDivElement;
  private zoomLabel: HTMLSpanElement;
  private pointers = new Map<number, PointerEvent>();
  private lastPinchDist: number | null = null;
  private dragStart: { x: number; y: number; sx: number; sy: number } | null =
    null;

  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.controlsEl = this.createControls();
    this.zoomLabel = this.controlsEl.querySelector(
      ".zoom-level"
    ) as HTMLSpanElement;
    container.parentElement!.insertBefore(this.controlsEl, container);
    this.attachEvents();
  }

  /** Call after each renderDiagram() to re-wrap the SVG */
  wrap(): void {
    const svg = this.container.querySelector("svg");
    if (!svg) return;
    if (this.wrapper && this.wrapper.parentElement === this.container && this.wrapper.contains(svg)) return;

    this.wrapper = document.createElement("div");
    this.wrapper.className = "pan-zoom-wrapper";
    this.container.appendChild(this.wrapper);
    this.wrapper.appendChild(svg);
    this.applyTransform();
  }

  reset(): void {
    this.state = { scale: 1, x: 0, y: 0 };
    this.applyTransform();
  }

  private applyTransform(): void {
    if (!this.wrapper) return;
    this.wrapper.style.transform = `translate(${this.state.x}px, ${this.state.y}px) scale(${this.state.scale})`;
    this.zoomLabel.textContent = `${Math.round(this.state.scale * 100)}%`;
  }

  private zoomAt(factor: number, clientX: number, clientY: number): void {
    const rect = this.container.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const newScale = clamp(this.state.scale * factor, MIN_SCALE, MAX_SCALE);
    const ratio = newScale / this.state.scale;
    this.state.x = px - ratio * (px - this.state.x);
    this.state.y = py - ratio * (py - this.state.y);
    this.state.scale = newScale;
    this.applyTransform();
  }

  private zoomCenter(factor: number): void {
    const rect = this.container.getBoundingClientRect();
    this.zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  private createControls(): HTMLDivElement {
    const controls = document.createElement("div");
    controls.className = "zoom-controls";

    const zoomIn = document.createElement("button");
    zoomIn.textContent = "+";
    zoomIn.setAttribute("aria-label", "Zoom in");
    zoomIn.addEventListener("click", () => this.zoomCenter(ZOOM_FACTOR));

    const zoomOut = document.createElement("button");
    zoomOut.textContent = "\u2212";
    zoomOut.setAttribute("aria-label", "Zoom out");
    zoomOut.addEventListener("click", () => this.zoomCenter(1 / ZOOM_FACTOR));

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset";
    resetBtn.setAttribute("aria-label", "Reset zoom");
    resetBtn.addEventListener("click", () => this.reset());

    const label = document.createElement("span");
    label.className = "zoom-level";
    label.textContent = "100%";

    controls.append(zoomIn, zoomOut, resetBtn, label);
    return controls;
  }

  private attachEvents(): void {
    // Ctrl+wheel zoom
    this.container.addEventListener("wheel", (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      this.zoomAt(factor, e.clientX, e.clientY);
    }, { passive: false });

    // Pointer events for pan + pinch
    this.container.addEventListener("pointerdown", (e) => {
      this.pointers.set(e.pointerId, e);
      if (this.pointers.size === 1) {
        this.dragStart = {
          x: e.clientX,
          y: e.clientY,
          sx: this.state.x,
          sy: this.state.y,
        };
        this.container.setPointerCapture(e.pointerId);
        this.container.classList.add("panning");
      } else if (this.pointers.size === 2) {
        this.dragStart = null;
        this.lastPinchDist = this.getPinchDist();
      }
    });

    this.container.addEventListener("pointermove", (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, e);

      if (this.pointers.size === 1 && this.dragStart) {
        this.state.x = this.dragStart.sx + (e.clientX - this.dragStart.x);
        this.state.y = this.dragStart.sy + (e.clientY - this.dragStart.y);
        this.applyTransform();
      } else if (this.pointers.size === 2 && this.lastPinchDist !== null) {
        const dist = this.getPinchDist();
        const mid = this.getPinchMid();
        const factor = dist / this.lastPinchDist;
        this.zoomAt(factor, mid.x, mid.y);
        this.lastPinchDist = dist;
      }
    });

    const endPointer = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size === 0) {
        this.dragStart = null;
        this.container.classList.remove("panning");
      }
      this.lastPinchDist = null;
    };

    this.container.addEventListener("pointerup", endPointer);
    this.container.addEventListener("pointercancel", endPointer);
  }

  private getPinchDist(): number {
    const pts = [...this.pointers.values()];
    const dx = pts[0].clientX - pts[1].clientX;
    const dy = pts[0].clientY - pts[1].clientY;
    return Math.hypot(dx, dy);
  }

  private getPinchMid(): { x: number; y: number } {
    const pts = [...this.pointers.values()];
    return {
      x: (pts[0].clientX + pts[1].clientX) / 2,
      y: (pts[0].clientY + pts[1].clientY) / 2,
    };
  }
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function createPanZoom(container: HTMLElement): PanZoomController {
  return new PanZoomController(container);
}
