import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import packageMetadata from "./package.json";

const DEPLOYMENT_BASE_PATH = "./";
const PUBLIC_ASSET_PATH_PATTERN =
	/(["'`])\/([^"'`]+\.(?:avif|basis|bin|exr|gif|glb|gltf|hdr|jpe?g|ktx2|mp3|ogg|png|svg|wav|webp))\1/g;
const STONE_GRAIN_ASSET_PATTERN = /(["'`])\.\/perlinnoise\.webp\1/g;

function resolveSourceRevision(): string {
	try {
		const revision = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
		if (revision.length > 0) {
			return revision;
		}
	} catch {
		// Source archives may not contain Git metadata.
	}
	return new Date().toISOString().replace(/\D/g, "");
}

const SOURCE_REVISION = resolveSourceRevision();

function rewriteRootPublicAssetPaths(): Plugin {
	return {
		name: "rewrite-root-public-asset-paths",
		enforce: "pre",
		transform(source, id) {
			if (!id.includes("/src/")) {
				return null;
			}

			const relativeCode = source.replace(
				PUBLIC_ASSET_PATH_PATTERN,
				(_match, quote: string, assetPath: string) =>
					`${quote}${DEPLOYMENT_BASE_PATH}${assetPath}${quote}`
			);
			const code = relativeCode.replace(
				STONE_GRAIN_ASSET_PATTERN,
				(_match, quote: string) =>
					`${quote}${DEPLOYMENT_BASE_PATH}perlinnoise.webp?v=${encodeURIComponent(SOURCE_REVISION)}${quote}`
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
		__APP_VERSION__: JSON.stringify(
			`v${packageMetadata.version}+${SOURCE_REVISION}`
		),
		__BUILD_LABEL__: JSON.stringify(new Date().toISOString().slice(0, 10)),
	},
	plugins: [rewriteRootPublicAssetPaths(), includeLegalFiles()],
});
