import { defineConfig, type Plugin } from "vite";

const DEPLOYMENT_BASE_PATH = "./";
const PUBLIC_ASSET_PATH_PATTERN =
	/(["'`])\/([^"'`]+\.(?:avif|basis|bin|exr|gif|glb|gltf|hdr|jpe?g|ktx2|mp3|ogg|png|svg|wav|webp))\1/g;

function rewriteRootPublicAssetPaths(): Plugin {
	return {
		name: "rewrite-root-public-asset-paths",
		enforce: "pre",
		transform(source, id) {
			if (!id.includes("/src/")) {
				return null;
			}

			const code = source.replace(
				PUBLIC_ASSET_PATH_PATTERN,
				(_match, quote: string, assetPath: string) =>
					`${quote}${DEPLOYMENT_BASE_PATH}${assetPath}${quote}`
			);

			return code === source ? null : { code, map: null };
		},
	};
}

export default defineConfig({
	base: DEPLOYMENT_BASE_PATH,
	plugins: [rewriteRootPublicAssetPaths()],
});
