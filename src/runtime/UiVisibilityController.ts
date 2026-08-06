const STORAGE_KEY = "drusniel-world-hud-minimized";

export class UiVisibilityController {
  private readonly button =
    document.querySelector<HTMLButtonElement>("#ui-toggle");
  private minimized = false;

  initialize(): void {
    if (!this.button) {
      return;
    }
    this.minimized = readStoredState();
    this.apply();
    this.button.addEventListener("click", this.toggle);
  }

  private readonly toggle = (): void => {
    this.minimized = !this.minimized;
    this.apply();
    try {
      localStorage.setItem(STORAGE_KEY, this.minimized ? "1" : "0");
    } catch {
      // Storage is optional; the current session still works without it.
    }
  };

  private apply(): void {
    document.documentElement.dataset.uiMinimized = this.minimized
      ? "true"
      : "false";
    if (!this.button) {
      return;
    }
    this.button.textContent = this.minimized ? "HUD" : "−";
    this.button.setAttribute("aria-pressed", String(this.minimized));
    this.button.setAttribute(
      "aria-label",
      this.minimized ? "Restore interface" : "Minimize interface",
    );
    this.button.title = this.minimized
      ? "Restore interface"
      : "Minimize interface";
  }
}

function readStoredState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
