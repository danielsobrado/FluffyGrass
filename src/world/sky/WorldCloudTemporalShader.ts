export const WORLD_CLOUD_TEMPORAL_FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D uCurrentTexture;
uniform sampler2D uHistoryTexture;
uniform mat4 uProjectionMatrixInverse;
uniform mat4 uCameraMatrixWorld;
uniform mat4 uPreviousViewProjection;
uniform vec3 uCameraPosition;
uniform vec2 uCloudWind;
uniform float uCloudBaseHeight;
uniform float uCloudThickness;
uniform float uDeltaSeconds;
uniform float uTemporalBlend;
uniform float uHistoryValid;
varying vec2 vUv;

vec3 reconstructHistoryRay(vec2 uv) {
  vec4 view = uProjectionMatrixInverse * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
  vec3 viewDirection = normalize(view.xyz / max(abs(view.w), 0.0001));
  return normalize((uCameraMatrixWorld * vec4(viewDirection, 0.0)).xyz);
}

void main() {
  vec4 currentCloud = texture2D(uCurrentTexture, vUv);
  if (uHistoryValid < 0.5) {
    gl_FragColor = currentCloud;
    return;
  }

  vec3 rayDirection = reconstructHistoryRay(vUv);
  if (rayDirection.y <= 0.025) {
    gl_FragColor = currentCloud;
    return;
  }

  float historyDistance =
    (uCloudBaseHeight + uCloudThickness * 0.5) / rayDirection.y;
  vec3 previousParcel =
    uCameraPosition + rayDirection * historyDistance;
  previousParcel.xz += uCloudWind * uDeltaSeconds;
  vec4 previousClip =
    uPreviousViewProjection * vec4(previousParcel, 1.0);
  if (previousClip.w <= 0.0001) {
    gl_FragColor = currentCloud;
    return;
  }

  vec2 previousUv =
    previousClip.xy / previousClip.w * 0.5 + 0.5;
  if (
    previousUv.x <= 0.0 ||
    previousUv.y <= 0.0 ||
    previousUv.x >= 1.0 ||
    previousUv.y >= 1.0
  ) {
    gl_FragColor = currentCloud;
    return;
  }

  vec4 historyCloud = texture2D(uHistoryTexture, previousUv);
  float alphaDifference =
    abs(currentCloud.a - historyCloud.a);
  float rejection =
    smoothstep(0.07, 0.30, alphaDifference);
  float blend =
    uTemporalBlend * (1.0 - rejection);
  gl_FragColor = mix(currentCloud, historyCloud, blend);
}
`;
