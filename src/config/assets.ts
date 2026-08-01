export const ASSET_PATHS = {
	island: "island.glb",
	grassLods: "grassLODs.glb",
	title: "fluffy_grass_text.glb",
	perlinNoise: "perlinnoise.webp",
	grassAlpha: "grass.jpeg",
} as const;

export function getAssetUrl(path: string): string {
	return `${import.meta.env.BASE_URL}${path}`;
}
