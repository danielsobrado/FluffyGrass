import { defineConfig, type Plugin } from "vite";
import { readFileSync } from "node:fs";
import packageMetadata from "./package.json";

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

function includeLegalFiles(): Plugin {
	return {
		name: "include-legal-files",
		generateBundle() {
			for (const fileName of ["LICENSE", "THIRD_PARTY_NOTICES.md"]) {
				this.emitFile({
					type: "asset",
					fileName,
					source: readFileSync(new URL(fileName, import.meta.url), "utf8"),
				});
			}
		},
	};
}

export default defineConfig({
	base: DEPLOYMENT_BASE_PATH,
	define: {
		__APP_VERSION__: JSON.stringify(`v${packageMetadata.version}`),
		__BUILD_LABEL__: JSON.stringify(new Date().toISOString().slice(0, 10)),
	},
	plugins: [rewriteRootPublicAssetPaths(), includeLegalFiles()],
});
