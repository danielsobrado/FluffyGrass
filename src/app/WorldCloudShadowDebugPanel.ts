import * as THREE from "three";
import type { WorldCloudShadowDiagnostics } from "../world/sky/WorldCloudShadowMap";
import {
  WorldCloudShadowDebugVisibility,
  type WorldCloudShadowDebugVisibilityState,
} from "./WorldCloudShadowDebugVisibility";

const UPDATE_INTERVAL_SECONDS = 0.25;
const VISIBILITY_SCAN_INTERVAL_SECONDS = 0.5;

interface WorldCloudShadowDebugDiagnostics extends WorldCloudShadowDiagnostics {
  patchedMaterials: number;
  globalDirectTransmittance: number;
  appliedDirectTransmittance: number;
  weatherAmount: number;
  weatherRegime: "clear" | "fair" | "overcast" | "storm";
}

export interface WorldCloudShadowDebugHost {
  getDiagnostics(): WorldCloudShadowDebugDiagnostics;
  readPixels(target: Uint8Array): boolean;
  setSpatialEnabled(enabled: boolean): void;
  setDirectAttenuationEnabled(enabled: boolean): void;
  setSunShadowsEnabled(enabled: boolean): void;
}

interface DebugState extends WorldCloudShadowDebugVisibilityState {
  spatial: boolean;
  direct: boolean;
  sunShadows: boolean;
}

interface PreviewStats {
  minTransmittance: number;
  maxTransmittance: number;
  minDensity: number;
  maxDensity: number;
}

export class WorldCloudShadowDebugPanel {
  private readonly state: DebugState;
  private readonly visibility: WorldCloudShadowDebugVisibility;
  private readonly root?: HTMLDivElement;
  private readonly readout?: HTMLPreElement;
  private readonly canvas?: HTMLCanvasElement;
  private readonly context?: CanvasRenderingContext2D;
  private pixels?: Uint8Array;
  private imageData?: ImageData;
  private updateCountdown = 0;
  private visibilityCountdown = 0;
  private disposed = false;

  static createIfRequested(
    scene: THREE.Scene,
    host: WorldCloudShadowDebugHost,
  ): WorldCloudShadowDebugPanel | undefined {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }
    const params = new URLSearchParams(window.location.search);
    const requested =
      params.get("diagnostics") === "1" ||
      params.get("cloudShadowDebug") === "1" ||
      params.has("cloudShadows") ||
      params.has("cloudDirect") ||
      params.has("sunShadows") ||
      params.has("terrain") ||
      params.has("grass") ||
      params.has("water");
    return requested
      ? new WorldCloudShadowDebugPanel(scene, host, params)
      : undefined;
  }

  private constructor(
    scene: THREE.Scene,
    private readonly host: WorldCloudShadowDebugHost,
    params: URLSearchParams,
  ) {
    this.visibility = new WorldCloudShadowDebugVisibility(scene);
    this.state = {
      spatial: params.get("cloudShadows") !== "off",
      direct: params.get("cloudDirect") !== "off",
      sunShadows: params.get("sunShadows") !== "off",
      terrain: params.get("terrain") !== "off",
      grass: params.get("grass") !== "off",
      water: params.get("water") !== "off",
    };
    this.applyLightingState();
    this.applyVisibilityState();

    if (
      params.get("diagnostics") !== "1" &&
      params.get("cloudShadowDebug") !== "1"
    ) {
      return;
    }

    const root = document.createElement("div");
    root.dataset.worldCloudShadowDebug = "true";
    Object.assign(root.style, {
      position: "fixed",
      left: "10px",
      bottom: "10px",
      zIndex: "10000",
      width: "236px",
      padding: "8px",
      borderRadius: "6px",
      background: "rgba(10, 14, 18, 0.84)",
      color: "#eef4f8",
      font: "12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace",
      pointerEvents: "auto",
    });
    const title = document.createElement("div");
    title.textContent = "Cloud shadow diagnostics";
    title.style.fontWeight = "700";
    title.style.marginBottom = "6px";
    root.appendChild(title);
    this.addToggle(root, "Spatial cloud shadow", "spatial");
    this.addToggle(root, "Global cloud direct", "direct");
    this.addToggle(root, "Sun shadow map", "sunShadows");
    this.addToggle(root, "Terrain", "terrain");
    this.addToggle(root, "Grass", "grass");
    this.addToggle(root, "Water", "water");

    const canvas = document.createElement("canvas");
    canvas.style.width = "220px";
    canvas.style.height = "110px";
    canvas.style.objectFit = "fill";
    canvas.style.display = "block";
    canvas.style.marginTop = "6px";
    canvas.style.imageRendering = "auto";
    root.appendChild(canvas);

    const legend = document.createElement("div");
    legend.textContent = "transmittance | density";
    legend.style.textAlign = "center";
    legend.style.opacity = "0.8";
    root.appendChild(legend);

    const readout = document.createElement("pre");
    readout.style.margin = "6px 0 0";
    readout.style.whiteSpace = "pre-wrap";
    root.appendChild(readout);
    document.body.appendChild(root);

    this.root = root;
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false }) ?? undefined;
    this.readout = readout;
  }

  update(deltaSeconds: number): void {
    if (this.disposed) {
      return;
    }
    this.visibilityCountdown -= Math.max(0, deltaSeconds);
    if (this.visibilityCountdown <= 0) {
      this.visibilityCountdown = VISIBILITY_SCAN_INTERVAL_SECONDS;
      this.applyVisibilityState();
    }
    if (!this.root || !this.context || !this.canvas || !this.readout) {
      return;
    }
    this.updateCountdown -= Math.max(0, deltaSeconds);
    if (this.updateCountdown > 0) {
      return;
    }
    this.updateCountdown = UPDATE_INTERVAL_SECONDS;
    const diagnostics = this.host.getDiagnostics();
    const preview = this.updatePreview(diagnostics.resolution);
    this.readout.textContent = [
      `enabled: ${diagnostics.enabled}`,
      `weather: ${diagnostics.weatherRegime} ${diagnostics.weatherAmount.toFixed(3)}`,
      `spatial/direct/sun: ${flag(this.state.spatial)}/${flag(this.state.direct)}/${flag(this.state.sunShadows)}`,
      `map: ${diagnostics.resolution}² / ${diagnostics.worldSize.toFixed(0)} m`,
      `focus T: ${diagnostics.focusTransmittance.toFixed(3)}`,
      `global/applied T: ${diagnostics.globalDirectTransmittance.toFixed(3)}/${diagnostics.appliedDirectTransmittance.toFixed(3)}`,
      preview
        ? `T range: ${preview.minTransmittance.toFixed(3)}–${preview.maxTransmittance.toFixed(3)}`
        : "T range: unavailable",
      preview
        ? `density: ${preview.minDensity.toFixed(3)}–${preview.maxDensity.toFixed(3)}`
        : "density: unavailable",
      `origin: ${diagnostics.originX.toFixed(1)}, ${diagnostics.originZ.toFixed(1)}`,
      `patched: ${diagnostics.patchedMaterials}`,
    ].join("\n");
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.visibility.dispose();
    this.root?.remove();
    this.pixels = undefined;
    this.imageData = undefined;
  }

  private addToggle(
    root: HTMLElement,
    labelText: string,
    key: keyof DebugState,
  ): void {
    const label = document.createElement("label");
    label.style.display = "block";
    label.style.cursor = "pointer";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.state[key];
    input.style.marginRight = "6px";
    input.addEventListener("change", () => {
      this.state[key] = input.checked;
      if (key === "terrain" || key === "grass" || key === "water") {
        this.applyVisibilityState();
      } else {
        this.applyLightingState();
      }
    });
    label.append(input, labelText);
    root.appendChild(label);
  }

  private applyLightingState(): void {
    this.host.setSpatialEnabled(this.state.spatial);
    this.host.setDirectAttenuationEnabled(this.state.direct);
    this.host.setSunShadowsEnabled(this.state.sunShadows);
  }

  private applyVisibilityState(): void {
    this.visibility.update(this.state);
  }

  private updatePreview(resolution: number): PreviewStats | undefined {
    if (resolution <= 0 || !this.context || !this.canvas) {
      return undefined;
    }
    const byteCount = resolution * resolution * 4;
    if (!this.pixels || this.pixels.length !== byteCount) {
      this.pixels = new Uint8Array(byteCount);
      this.imageData = this.context.createImageData(resolution * 2, resolution);
      this.canvas.width = resolution * 2;
      this.canvas.height = resolution;
    }
    if (!this.imageData || !this.pixels || !this.host.readPixels(this.pixels)) {
      return undefined;
    }
    const output = this.imageData.data;
    let minTransmittance = 255;
    let maxTransmittance = 0;
    let minDensity = 255;
    let maxDensity = 0;
    for (let y = 0; y < resolution; y += 1) {
      const sourceY = resolution - 1 - y;
      for (let x = 0; x < resolution; x += 1) {
        const source = (sourceY * resolution + x) * 4;
        const transmittance = this.pixels[source];
        const density = this.pixels[source + 1];
        minTransmittance = Math.min(minTransmittance, transmittance);
        maxTransmittance = Math.max(maxTransmittance, transmittance);
        minDensity = Math.min(minDensity, density);
        maxDensity = Math.max(maxDensity, density);
        const left = (y * resolution * 2 + x) * 4;
        const right = (y * resolution * 2 + x + resolution) * 4;
        writeGray(output, left, transmittance);
        writeGray(output, right, density);
      }
    }
    this.context.putImageData(this.imageData, 0, 0);
    return {
      minTransmittance: minTransmittance / 255,
      maxTransmittance: maxTransmittance / 255,
      minDensity: minDensity / 255,
      maxDensity: maxDensity / 255,
    };
  }
}

function flag(value: boolean): string {
  return value ? "on" : "off";
}

function writeGray(target: Uint8ClampedArray, offset: number, value: number): void {
  target[offset] = value;
  target[offset + 1] = value;
  target[offset + 2] = value;
  target[offset + 3] = 255;
}
