import type * as THREE from "three";

const PANEL_ID = "grass-qa-downloads";

export class GrassQaDownloads {
  captureScreenshot(renderer: THREE.WebGLRenderer, name: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      renderer.domElement.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`Unable to capture QA screenshot ${name}.`));
        }
      }, "image/png");
    });
  }

  add(blob: Blob, fileName: string, label: string): void {
    const panel = this.getPanel();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.textContent = label;
    link.dataset.pendingDownload = "1";
    link.style.color = "#fff";
    link.addEventListener(
      "click",
      () => window.setTimeout(() => URL.revokeObjectURL(link.href), 1_000),
      { once: true },
    );
    panel.appendChild(link);
  }

  triggerPending(): void {
    const links = document.querySelectorAll<HTMLAnchorElement>(
      `#${PANEL_ID} a[data-pending-download='1']`,
    );
    links.forEach((link, index) => {
      window.setTimeout(() => link.click(), index * 150);
      delete link.dataset.pendingDownload;
    });
  }

  private getPanel(): HTMLDivElement {
    const existing = document.querySelector<HTMLDivElement>(`#${PANEL_ID}`);
    if (existing) {
      return existing;
    }

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.cssText =
      "position:fixed;left:12px;bottom:12px;z-index:10000;padding:12px;background:#111d;color:#fff;font:13px sans-serif;border-radius:8px;display:flex;gap:10px;flex-wrap:wrap;max-width:70vw";
    document.body.appendChild(panel);
    return panel;
  }
}
