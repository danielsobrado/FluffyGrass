import type Stats from "stats-gl";
import type { WebGLRenderer } from "three";

export async function attachWorldStatsPanel(
  renderer: WebGLRenderer,
): Promise<Stats | undefined> {
  try {
    const { default: StatsPanel } = await import("stats-gl");
    const stats = new StatsPanel({ minimal: true });
    stats.init(renderer);
    document.body.appendChild(stats.dom);
    return stats;
  } catch (error) {
    console.warn("[Drusniel World] Optional stats panel unavailable.", error);
    return undefined;
  }
}
