import * as THREE from "three";
import { mergeActorParts } from "../../actor/geometry/ActorPartMerge";
import { applyActorEnvironmentResponse } from "../../render/ActorEnvironmentResponse";
import {
  buildVillagerParts,
  type VillagerPartSlot,
} from "./VillagerGeometry";
import { VILLAGER_PALETTES, villagerPaletteFor } from "./VillagerPalette";

const VILLAGER_ROUGHNESS = 0.9;

export interface VillagerAssets {
  geometryFor(variant: number, slot: VillagerPartSlot): THREE.BufferGeometry;
  createMaterial(): THREE.MeshStandardMaterial;
  readonly variantCount: number;
  dispose(): void;
}

/**
 * Shared villager geometry, one set per palette.
 *
 * Colour rides on the vertices rather than on the material here, unlike the
 * deer: a villager's palette is a handful of discrete garments, not a coat tone,
 * so baking it into the buffer means the material carries nothing at all and
 * every villager in the world can share one. The variants are the variation.
 */
class VillagerAssetLibrary implements VillagerAssets {
  readonly variantCount = VILLAGER_PALETTES.length;
  private readonly built = new Map<
    number,
    Map<VillagerPartSlot, THREE.BufferGeometry>
  >();
  private disposed = false;

  geometryFor(variant: number, slot: VillagerPartSlot): THREE.BufferGeometry {
    const geometry = this.require(variant).get(slot);
    if (geometry === undefined) {
      throw new Error(`Villager variant ${variant} has no geometry for "${slot}".`);
    }
    return geometry;
  }

  createMaterial(): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: VILLAGER_ROUGHNESS,
      metalness: 0,
    });
    applyActorEnvironmentResponse(material);
    return material;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const slots of this.built.values()) {
      for (const geometry of slots.values()) {
        geometry.dispose();
      }
      slots.clear();
    }
    this.built.clear();
  }

  private require(
    variant: number,
  ): Map<VillagerPartSlot, THREE.BufferGeometry> {
    if (this.disposed) {
      throw new Error("Villager assets were used after disposal.");
    }
    const key = Math.abs(Math.floor(variant)) % this.variantCount;
    const existing = this.built.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const slots = new Map<VillagerPartSlot, THREE.BufferGeometry>();
    const parts = buildVillagerParts(villagerPaletteFor(key));
    for (const [slot, list] of parts) {
      slots.set(slot, mergeActorParts(list));
      for (const part of list) {
        part.geometry.dispose();
      }
    }
    this.built.set(key, slots);
    return slots;
  }
}

export function createVillagerAssets(): VillagerAssets {
  return new VillagerAssetLibrary();
}
