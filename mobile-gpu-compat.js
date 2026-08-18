(() => {
  const MOBILE_USER_AGENT = /Android|iPhone|iPad|iPod|Mobile|Silk/i;
  const COARSE_POINTER_QUERY = "(pointer: coarse)";
  const PATCH_FLAG = "__drusnielGrassImpostorGpuPatch";
  const IMPOSTOR_ATTRIBUTE = "attribute vec2 grassSubpatchOffset;";
  const IMPOSTOR_ATLAS_MARKER = "uniform sampler2D uAtlas;";
  const IMPOSTOR_FRAME_MARKER = "vec4 sampleFrame(";
  const REJECTED_CLIP_POSITION = "gl_Position = vec4(2.0, 2.0, 2.0, 1.0);";
  const COMPACT_MIP_SAMPLE =
    "return textureLod(uAtlas, atlasUv, log2(max(texelsPerPixel, 1.0)));";
  const BASE_LEVEL_SAMPLE = "return textureLod(uAtlas, atlasUv, 0.0);";
  const ALPHA_CUTOFF_MARKER = "  float cutoff = mix(";
  const INVALID_ATLAS_GUARD =
    "  // Transparent canvas texels must never become opaque black card pixels.\n" +
    "  if (atlasColor.a > 0.99 && dot(atlasColor.rgb, atlasColor.rgb) < 1e-6) {\n" +
    "    discard;\n" +
    "  }\n\n";

  const compactDevice =
    window.matchMedia(COARSE_POINTER_QUERY).matches ||
    (navigator.maxTouchPoints > 0 && MOBILE_USER_AGENT.test(navigator.userAgent));
  if (!compactDevice) {
    return;
  }

  const patchVertexShader = (source) => {
    if (
      !source.includes(IMPOSTOR_ATTRIBUTE) ||
      source.includes("vec3 safeNormalize3(vec3 value")
    ) {
      return source;
    }

    let patched = source;
    patched = patched.replace(
      "#include <fog_pars_vertex>\n\nvoid main() {",
      `#include <fog_pars_vertex>\n\nvec3 safeNormalize3(vec3 value, vec3 fallbackValue) {\n  float lengthSquared = dot(value, value);\n  return lengthSquared > 1e-8\n    ? value * inversesqrt(lengthSquared)\n    : fallbackValue;\n}\n\nvoid main() {`,
    );
    patched = patched.replace(
      "  float scaleY = max(length(instanceAxisY), 0.0001);\n  vec3 basisX = instanceAxisX / scaleX;\n  vec3 basisY = instanceAxisY / scaleY;\n  vec3 basisZ = instanceAxisZ / scaleX;",
      "  float scaleY = max(length(instanceAxisY), 0.0001);\n  float scaleZ = max(length(instanceAxisZ), 0.0001);\n  vec3 basisX = instanceAxisX / scaleX;\n  vec3 basisY = instanceAxisY / scaleY;\n  vec3 basisZ = instanceAxisZ / scaleZ;",
    );
    patched = patched.replace(
      "    basisZ * grassSubpatchOffset.y * scaleX;",
      "    basisZ * grassSubpatchOffset.y * scaleZ;",
    );
    patched = patched.replace(
      "  vec3 toCamera = normalize(cameraPosition - center);",
      "  vec3 toCamera = safeNormalize3(cameraPosition - center, basisZ);",
    );
    patched = patched.replace(
      /  vec3 cardUp = normalize\(mix\(\n    worldUp,\n    basisY,\n    ([^\n]+)\n  \)\);/,
      "  vec3 cardUp = safeNormalize3(\n    mix(worldUp, basisY, $1),\n    worldUp\n  );",
    );
    patched = patched.replace(
      "  planarView /= max(planarViewLength, 0.001);\n  vec3 cylindricalRight = normalize(cross(cardUp, planarView));",
      "  if (planarViewLength < 0.001) {\n    planarView = basisX - cardUp * dot(basisX, cardUp);\n  }\n  planarView = safeNormalize3(planarView, vec3(0.0, 0.0, 1.0));\n  vec3 cylindricalRight = safeNormalize3(cross(cardUp, planarView), basisX);",
    );
    patched = patched.replace(
      "  vec3 sphericalRight = cross(basisY, toCamera);\n  float sphericalRightLength = length(sphericalRight);\n  sphericalRight = sphericalRightLength < 0.001\n    ? basisX\n    : sphericalRight / sphericalRightLength;\n  vec3 sphericalUp = normalize(cross(toCamera, sphericalRight));",
      "  vec3 sphericalRight = safeNormalize3(cross(basisY, toCamera), basisX);\n  vec3 sphericalUp = safeNormalize3(cross(toCamera, sphericalRight), cardUp);",
    );
    patched = patched.replace(
      "  vec3 billboardRight = normalize(mix(\n    cylindricalRight,\n    sphericalRight,\n    aerialBlend\n  ));\n  vec3 billboardUp = normalize(mix(cardUp, sphericalUp, aerialBlend));",
      "  vec3 billboardRight = safeNormalize3(\n    mix(cylindricalRight, sphericalRight, aerialBlend),\n    cylindricalRight\n  );\n  vec3 billboardUp = safeNormalize3(\n    mix(cardUp, sphericalUp, aerialBlend),\n    cardUp\n  );",
    );
    patched = patched.replace(
      "  if (effectiveCoverage <= 0.001) {\n    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);\n    return;\n  }",
      "  float cardVisibility = step(0.001, effectiveCoverage);",
    );
    patched = patched.replace(
      "  if (terrainDither >= terrainCoverage) {\n    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);\n    return;\n  }",
      "  cardVisibility *= 1.0 - step(terrainCoverage, terrainDither);",
    );
    patched = patched.replace(
      "  gl_Position = projectionMatrix * mvPosition;",
      "  gl_Position = cardVisibility < 0.5\n    ? vec4(0.0, 0.0, 0.0, 1.0)\n    : projectionMatrix * mvPosition;",
    );
    patched = patched.replace(
      "  vec3 grassWorldNormal = normalize(mix(\n    basisZ,\n    basisY,\n    mix(uNormalUp, 1.0, saturate((cameraDistance - 48.0) / 90.0))\n  ));\n  vec3 grassViewNormal = normalize(mat3(viewMatrix) * grassWorldNormal);",
      "  vec3 grassWorldNormal = safeNormalize3(\n    mix(\n      basisZ,\n      basisY,\n      mix(uNormalUp, 1.0, saturate((cameraDistance - 48.0) / 90.0))\n    ),\n    basisY\n  );\n  vec3 grassViewNormal = safeNormalize3(\n    mat3(viewMatrix) * grassWorldNormal,\n    vec3(0.0, 1.0, 0.0)\n  );",
    );
    patched = patched.replace(
      "normalize(mvPosition.xyz)",
      "safeNormalize3(mvPosition.xyz, vec3(0.0, 0.0, -1.0))",
    );
    patched = patched.replace(
      "  vLocalViewDirection = normalize(localViewDirection);",
      "  vLocalViewDirection = safeNormalize3(localViewDirection, vec3(0.0, 0.0, 1.0));",
    );

    if (
      !patched.includes("vec3 safeNormalize3(vec3 value") ||
      patched.includes(REJECTED_CLIP_POSITION) ||
      !patched.includes("float cardVisibility = step(0.001, effectiveCoverage);") ||
      !patched.includes("safeNormalize3(cameraPosition - center, basisZ)")
    ) {
      return source;
    }
    return patched;
  };

  const patchFragmentShader = (source) => {
    if (
      !source.includes(IMPOSTOR_ATLAS_MARKER) ||
      !source.includes(IMPOSTOR_FRAME_MARKER) ||
      !source.includes(COMPACT_MIP_SAMPLE)
    ) {
      return source;
    }

    let patched = source.replace(COMPACT_MIP_SAMPLE, BASE_LEVEL_SAMPLE);
    if (
      !patched.includes(INVALID_ATLAS_GUARD) &&
      patched.includes(ALPHA_CUTOFF_MARKER)
    ) {
      patched = patched.replace(
        ALPHA_CUTOFF_MARKER,
        INVALID_ATLAS_GUARD + ALPHA_CUTOFF_MARKER,
      );
    }
    return patched;
  };

  const patchShader = (source) => {
    if (source.includes(IMPOSTOR_ATTRIBUTE)) {
      return patchVertexShader(source);
    }
    return patchFragmentShader(source);
  };

  const patchPrototype = (prototype) => {
    if (!prototype || prototype[PATCH_FLAG]) {
      return;
    }
    const originalShaderSource = prototype.shaderSource;
    if (typeof originalShaderSource !== "function") {
      return;
    }
    Object.defineProperty(prototype, PATCH_FLAG, { value: true });
    prototype.shaderSource = function shaderSource(shader, source) {
      return originalShaderSource.call(this, shader, patchShader(source));
    };
  };

  try {
    patchPrototype(globalThis.WebGL2RenderingContext?.prototype);
    patchPrototype(globalThis.WebGLRenderingContext?.prototype);
  } catch (error) {
    console.warn("[Drusniel World] Mobile GPU compatibility patch unavailable.", error);
  }
})();