import * as THREE from "three";
import type { WorldConfig } from "../../src/world/WorldConfig";
import { StoneField } from "../../src/world/stones/StoneField";
import { WorldStoneSystem } from "../../src/world/stones/WorldStoneSystem";
import { TerrainField } from "../../src/world/TerrainField";

type GrowthMode = "natural" | "moss" | "lichen";

export class StoneWorldProbeController {
  private stoneField: StoneField;
  private stones: WorldStoneSystem;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly field: TerrainField,
    private readonly focus: THREE.Vector3,
    private growth: GrowthMode,
    initialConfig: WorldConfig,
  ) {
    this.stoneField = this.wrapGrowth(new StoneField(field, initialConfig));
    this.stones = new WorldStoneSystem(
      scene,
      this.stoneField,
      initialConfig,
      false,
      false,
    );
    this.drain();
  }

  getField(): StoneField {
    return this.stoneField;
  }

  getSystem(): WorldStoneSystem {
    return this.stones;
  }

  rebuild(nextConfig: WorldConfig): void {
    this.stones.dispose();
    this.stoneField = this.wrapGrowth(new StoneField(this.field, nextConfig));
    this.stones = new WorldStoneSystem(
      this.scene,
      this.stoneField,
      nextConfig,
      false,
      false,
    );
    this.drain();
  }

  diagnosticsText(
    focusX: number,
    focusZ: number,
    groundHeight: number,
    span: number,
  ): string {
    const diagnostics = this.stones.getDiagnostics();
    const summary = this.stoneField.summarizeBounds(
      focusX - span * 0.5,
      focusZ - span * 0.5,
      focusX + span * 0.5,
      focusZ + span * 0.5,
    );
    return (
      `focus ${focusX} / ${focusZ} · ${this.growth} growth · ground ${groundHeight.toFixed(1)} m\n` +
      `${diagnostics.stones} stones · ${diagnostics.activeChunks} batches · ` +
      `${diagnostics.drawCalls} draws · ${diagnostics.triangles.toLocaleString()} tris\n` +
      `build last ${diagnostics.lastBuildMs.toFixed(1)} ms · peak ${diagnostics.maxBuildMs.toFixed(1)} ms\n` +
      `clusters ${summary.activeClusters} · compact ${summary.compact} ridge ${summary.ridge} ` +
      `scree ${summary.scree} fan ${summary.fan}\n` +
      `members ${summary.acceptedMembers} · splits ${summary.splits} · singletons ${summary.singletons}`
    );
  }

  private drain(): void {
    this.stones.update(this.focus, Number.POSITIVE_INFINITY);
    for (let pass = 0; pass < 400; pass += 1) {
      this.stones.update(this.focus, Number.POSITIVE_INFINITY);
    }
  }

  private wrapGrowth(stoneField: StoneField): StoneField {
    if (this.growth !== "moss" && this.growth !== "lichen") {
      return stoneField;
    }
    const collect = stoneField.collectChunkInstances.bind(stoneField);
    stoneField.collectChunkInstances = ((...args: Parameters<typeof collect>) => {
      const instances = collect(...args);
      for (const instance of instances) {
        const mutable = instance as {
          moss: number;
          paletteKey: "meadowSage" | "steppeTan" | "graniteGrey" | "mossy";
          graniteBlend: number;
        };
        if (this.growth === "moss") {
          mutable.moss = 0.95;
          mutable.paletteKey = "mossy";
          mutable.graniteBlend = 0;
        } else {
          mutable.moss = 0.03;
          mutable.paletteKey = "graniteGrey";
          mutable.graniteBlend = 1;
        }
      }
      return instances;
    }) as typeof stoneField.collectChunkInstances;
    return stoneField;
  }
}
