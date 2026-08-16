var Ke=Object.defineProperty;var Ze=(r,e,t)=>e in r?Ke(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var l=(r,e,t)=>Ze(r,typeof e!="symbol"?e+"":e,t);import{f as Qe,F as Je,b as es,P as S,c as ss,a as w,N as y,U as ts}from"./index-DZOul0gX.js";import{d as $}from"./ResourceDisposal-C6J2LlQF.js";import{ab as as,aa as J,v as rs,z as I,b as C,V as X,d as is,aw as os,a4 as k,W as ns,i as ls,ax as us,a as M,ay as Ue,a9 as cs,az as ds,k as hs,a2 as Ve,aA as ms,a6 as Se,$ as q,a1 as gs,Y as He,a0 as fs,aB as vs,Z as Ge,n as le,U as Ss,J as Gs}from"./WorldEnvironmentTuning-D6AfUm44.js";import{G as Y,a as ps}from"./GrassBiomeProfile-BhwQC6QL.js";const Ds=2,pe=2048,De=4,bs=/^#[0-9a-fA-F]{6}$/,be=1e5,Te=64,Ce=5e6;function Ts(r){if(r.instanceCount>be)throw new Error(`instanceCount must not exceed ${be}.`);if(r.geometry.variantCount>Te)throw new Error(`variantCount must not exceed ${Te}.`);if(r.geometry.variantCount>r.instanceCount)throw new Error("variantCount must not exceed instanceCount.");if(r.instanceCount*r.geometry.bladesPerClump*r.geometry.bladeSegments>Ce)throw new Error(`Configured near-grass workload must not exceed ${Ce}.`);if(r.geometry.bladesPerClump<3)throw new Error("bladesPerClump must be at least 3.");if(r.geometry.bladeSegments<2)throw new Error("bladeSegments must be at least 2.");if(r.geometry.midBladesPerClump<2)throw new Error("midBladesPerClump must be at least 2.");if(r.geometry.midBladeSegments<1)throw new Error("midBladeSegments must be at least 1.");if(r.geometry.midBladesPerClump>r.geometry.bladesPerClump)throw new Error("midBladesPerClump must not exceed bladesPerClump.");if(r.geometry.midBladeSegments>=r.geometry.bladeSegments)throw new Error("midBladeSegments must be lower than bladeSegments.");if(r.geometry.bladeHeightMin>r.geometry.bladeHeightMax)throw new Error("bladeHeightMin must be less than or equal to bladeHeightMax.");if(r.geometry.bladeWidthMin>r.geometry.bladeWidthMax)throw new Error("bladeWidthMin must be less than or equal to bladeWidthMax.");if(r.geometry.bladeLeanMin>r.geometry.bladeLeanMax)throw new Error("bladeLeanMin must be less than or equal to bladeLeanMax.");if(r.distribution.densityMin>r.distribution.densityMax)throw new Error("densityMin must be less than or equal to densityMax.");if(r.lod.nearMaxDistance>=r.lod.midMaxDistance||r.lod.midMaxDistance>=r.lod.farMaxDistance)throw new Error("Grass LOD distances must increase from near to far.");if(r.lod.transitionDistance>=r.lod.nearMaxDistance)throw new Error("transitionDistance must be lower than nearMaxDistance.");if(r.lod.hysteresisDistance>=r.lod.nearMaxDistance-r.lod.transitionDistance)throw new Error("hysteresisDistance is too large for the near LOD band.");if(Math.hypot(r.wind.directionX,r.wind.directionZ)<Number.EPSILON)throw new Error("Grass wind direction must not be zero.");for(const[t,s]of[["baseColor",r.material.baseColor],["tipColor",r.material.tipColor],["dryColor",r.material.dryColor]])if(!bs.test(s))throw new Error(`Grass config value ${t} must be a six-digit hex color.`);if(r.impostor.viewsPerAxis<2)throw new Error("impostorViewsPerAxis must be at least 2.");if(r.impostor.viewsPerAxis>16)throw new Error("impostorViewsPerAxis must not exceed 16.");if(r.impostor.frameResolution<32)throw new Error("impostorFrameResolution must be at least 32.");if(r.impostor.padding<De)throw new Error(`impostorPadding must be at least ${De} pixels for mip-safe atlas isolation.`);if((r.impostor.frameResolution+r.impostor.padding*2)*r.impostor.viewsPerAxis*Ds>pe)throw new Error(`Impostor atlas size must not exceed ${pe} pixels.`);if(r.impostor.cameraMargin<1)throw new Error("impostorCameraMargin must be at least 1.")}const Cs="./config/grass.yaml";function ys(){return`${Cs}?v=${encodeURIComponent("v0.9.6+071acea89e54")}`}class pa{async load(e=ys()){return this.parse(await Qe(e,"grass config"))}parse(e){const t=Je.parse(e,"grass"),s=new es(t,"Grass"),a={instanceCount:s.number("instanceCount",w),patchSize:s.number("patchSize",S),geometry:{variantCount:s.number("variantCount",w),bladesPerClump:s.number("bladesPerClump",w),bladeSegments:s.number("bladeSegments",w),clumpRadius:s.number("clumpRadius",S),bladeHeightMin:s.number("bladeHeightMin",S),bladeHeightMax:s.number("bladeHeightMax",S),bladeWidthMin:s.number("bladeWidthMin",S),bladeWidthMax:s.number("bladeWidthMax",S),bladeLeanMin:s.number("bladeLeanMin",y),bladeLeanMax:s.number("bladeLeanMax",y),bladeCurve:s.number("bladeCurve",{minimum:0,maximum:1.2}),midBladesPerClump:s.number("midBladesPerClump",w),midBladeSegments:s.number("midBladeSegments",w),midRadiusScale:s.number("midRadiusScale",S),midHeightScale:s.number("midHeightScale",S),midWidthScale:s.number("midWidthScale",S),midLeanScale:s.number("midLeanScale",y)},distribution:{seed:s.number("seed",ts),rootSink:s.number("rootSink",y),maxSlopeDegrees:s.number("maxSlopeDegrees",{minimum:0,maximum:89}),heightVariation:s.number("heightVariation",{minimum:0,maximum:.95}),widthVariation:s.number("widthVariation",{minimum:0,maximum:.95}),densityMin:s.number("densityMin",{minimum:0,maximum:1}),densityMax:s.number("densityMax",{minimum:0,maximum:1}),densityScale:s.number("densityScale",S)},wind:{directionX:s.number("windDirectionX"),directionZ:s.number("windDirectionZ"),strength:s.number("windStrength",y),gustScale:s.number("gustScale",S),gustSpeed:s.number("gustSpeed",y),flutterStrength:s.number("flutterStrength",y),flutterSpeed:s.number("flutterSpeed",y)},material:{baseColor:s.string("baseColor"),tipColor:s.string("tipColor"),dryColor:s.string("dryColor"),rootDarkening:s.number("rootDarkening",{minimum:0,maximum:1}),normalUp:s.number("normalUp",{minimum:0,maximum:1}),ambientBoost:s.number("ambientBoost",{minimum:0,maximum:1}),backlightStrength:s.number("backlightStrength",{minimum:0,maximum:1})},lod:{nearMaxDistance:s.number("nearMaxDistance",S),midMaxDistance:s.number("midMaxDistance",S),farMaxDistance:s.number("farMaxDistance",S),hysteresisDistance:s.number("hysteresisDistance",y),transitionDistance:s.number("transitionDistance",S)},qa:{warmupSeconds:s.number("qaWarmupSeconds",y),sampleSeconds:s.number("qaSampleSeconds",S)},impostor:{viewsPerAxis:s.number("impostorViewsPerAxis",w),frameResolution:s.number("impostorFrameResolution",w),padding:s.number("impostorPadding",ss),cameraMargin:s.number("impostorCameraMargin",S)}};return t.assertFullyConsumed(),Ts(a),Object.freeze({...a,geometry:Object.freeze(a.geometry),distribution:Object.freeze(a.distribution),wind:Object.freeze(a.wind),material:Object.freeze(a.material),lod:Object.freeze(a.lod),qa:Object.freeze(a.qa),impostor:Object.freeze(a.impostor)})}}class xs{constructor(e){l(this,"state");this.state=e>>>0}next(){this.state=this.state+1831565813>>>0;let e=this.state;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}range(e,t){return e+(t-e)*this.next()}}const Es=Math.PI*2,ye=2654435769,Rs=1e-4;function xe(r,e,t){const s=C.clamp(t,0,1);if(!(e>Rs))return{y:r*s,z:0};const a=s*s,o=e*a,i=r/e;return{y:i*Math.sin(o),z:i*(1-Math.cos(o))}}class Da{createLodVariants(e,t){const s={bladesPerClump:e.midBladesPerClump,bladeSegments:e.midBladeSegments,clumpRadius:e.clumpRadius*e.midRadiusScale,bladeHeightMin:e.bladeHeightMin*e.midHeightScale,bladeHeightMax:e.bladeHeightMax*e.midHeightScale,bladeWidthMin:e.bladeWidthMin*e.midWidthScale,bladeWidthMax:e.bladeWidthMax*e.midWidthScale,bladeLeanMin:e.bladeLeanMin*e.midLeanScale,bladeLeanMax:e.bladeLeanMax*e.midLeanScale,bladeCurve:e.bladeCurve};let a=[],o=[];try{return a=this.createVariants(e,e.variantCount,t),o=this.createVariants(s,e.variantCount,t^ye),{near:a,mid:o}}catch(i){throw V([...a,...o],"LOD variant"),i}}createInstancedGeometry(e,t,s,a,o){var n,d;const i=new as;try{e.index&&i.setIndex(e.index);for(const[g,f]of Object.entries(e.attributes))i.setAttribute(g,f);i.setAttribute("instanceVariation",(a==null?void 0:a.variation)??new J(t,4));const u=t.length/4,c=s??new Float32Array(u).fill(1);return i.setAttribute("instanceCoverage",(a==null?void 0:a.coverage)??new J(c,1)),i.setAttribute("instanceBiome",(a==null?void 0:a.biome)??new J(o??new Float32Array(u),1)),i.boundingBox=((n=e.boundingBox)==null?void 0:n.clone())??null,i.boundingSphere=((d=e.boundingSphere)==null?void 0:d.clone())??null,i}catch(u){throw V([i],"instanced geometry"),u}}disposeInstancedGeometry(e,t=!1){for(const s of Object.keys(e.attributes))(t||s!=="instanceVariation"&&s!=="instanceCoverage"&&s!=="instanceBiome")&&e.deleteAttribute(s);e.setIndex(null),e.dispose()}disposeInstancedMesh(e,t=!1){const s=e.geometry;$([{dispose:()=>this.disposeInstancedGeometry(s,t)},t?void 0:e])}createVariants(e,t,s){const a=[];try{for(let o=0;o<t;o+=1)a.push(this.createClump(e,s+o*ye));return a}catch(o){throw V(a,"partial variant set"),o}}createClump(e,t){const s=new xs(t),a=[],o=[],i=[],n=[],d=[],u=[];for(let g=0;g<e.bladesPerClump;g+=1){const f=s.range(0,Es),v=Math.sqrt(s.next())*e.clumpRadius,x=Math.cos(f)*v,_=Math.sin(f)*v,E=f+s.range(-.85,.85),G=Math.cos(E)*.5,R=Math.sin(E)*.5,A=-Math.sin(E),b=Math.cos(E),F=f+s.range(-.65,.65),P=s.range(e.bladeLeanMin,e.bladeLeanMax),ue=Math.cos(F)*P,ce=Math.sin(F)*P,de=s.range(e.bladeHeightMin,e.bladeHeightMax),Xe=s.range(e.bladeWidthMin,e.bladeWidthMax),K=s.next(),Z=s.next(),he=a.length/3;for(let L=0;L<e.bladeSegments;L+=1){const p=L/e.bladeSegments,ge=p*p*(3-2*p),Ye=Math.pow(1-p,.72),O=Xe*Ye,U=xe(de,e.bladeCurve,p),fe=x+ue*ge+A*U.z,ve=_+ce*ge+b*U.z;a.push(fe-G*O,U.y,ve-R*O,fe+G*O,U.y,ve+R*O),o.push(0,p,1,p),i.push(p,p),n.push(K,K),d.push(Z,Z)}const Q=xe(de,e.bladeCurve,1),ke=x+ue+A*Q.z,qe=_+ce+b*Q.z,je=a.length/3;a.push(ke,Q.y,qe),o.push(.5,1),i.push(1),n.push(K),d.push(Z);for(let L=0;L<e.bladeSegments-1;L+=1){const p=he+L*2;u.push(p,p+2,p+1,p+2,p+3,p+1)}const me=he+(e.bladeSegments-1)*2;u.push(me,je,me+1)}const c=new rs;try{return c.setAttribute("position",new I(a,3)),c.setAttribute("uv",new I(o,2)),c.setAttribute("grassProgress",new I(i,1)),c.setAttribute("grassPhase",new I(n,1)),c.setAttribute("grassBladeShade",new I(d,1)),c.setIndex(u),c.computeVertexNormals(),c.computeBoundingBox(),c.computeBoundingSphere(),c}catch(g){throw V([c],"clump geometry"),g}}}function V(r,e){try{$(r)}catch(t){console.warn(`[Drusniel World] Grass ${e} cleanup failed.`,t)}}const _s=0,ba=1.12,Ta=1.1,Ca=1.2,ya=.35,Ee=.07,xa=.08,Ea=.15;var D=(r=>(r[r.Near=0]="Near",r[r.Mid=1]="Mid",r[r.Far=2]="Far",r[r.Terrain=3]="Terrain",r))(D||{});class Ra{constructor(e){l(this,"patches",new Map);this.patchSize=e}keyFor(e){return this.key(Math.floor(e.x/this.patchSize),Math.floor(e.z/this.patchSize))}coordinatesFor(e){return[Math.floor(e.x/this.patchSize),Math.floor(e.z/this.patchSize)]}register(e){if(this.patches.has(e.id))throw new Error(`Grass patch ${e.id} is already registered.`);this.patches.set(e.id,e)}values(){return this.patches.values()}clear(){this.patches.clear()}key(e,t){return`${e}:${t}`}}const ee=.001,ws=1/1024,Re=3,Ms=4;function As(r,e){let t=0,s=r.length;for(;t<s;){const a=t+s>>>1;r[a]>e?t=a+1:s=a}return t}class _a{constructor(e){l(this,"cameraPosition",new X);l(this,"closestPoint",new X);l(this,"projectionViewMatrix",new is);l(this,"frustum",new os);l(this,"midFalloff",{start:0,end:1,floor:1,scale:1});l(this,"submittedMidVertices",0);l(this,"submittedFarInstances",0);l(this,"midInstanceRadius",Ms);l(this,"compactFarthest",0);l(this,"matrixSwap",new Float32Array(16));l(this,"variationSwap",new Float32Array(4));this.config=e}setMidDensityFalloff(e){this.midFalloff=e}setMidInstanceRadius(e){Number.isFinite(e)&&e>0&&(this.midInstanceRadius=e)}update(e,t){e.updateMatrixWorld(),e.getWorldPosition(this.cameraPosition),this.projectionViewMatrix.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projectionViewMatrix),this.submittedMidVertices=0;const s=this.config.farMaxDistance+this.config.transitionDistance;for(const a of t){if(a.bounds.clampPoint(this.cameraPosition,this.closestPoint),a.distance=this.cameraPosition.distanceTo(this.closestPoint),a.distance>=s){a.inFrustum=!1,a.nearMesh&&(a.nearMesh.visible=!1),a.midMesh.visible=!1,a.farMesh&&(a.farMesh.visible=!1);continue}a.inFrustum=this.frustum.intersectsBox(a.bounds),a.farMesh||a.hasFarImpostor?this.updateThreeStagePatch(a):this.updateLegacyPatch(a)}}updateFarGroups(e){const t=this.config.farMaxDistance+this.config.transitionDistance,s=this.config.midMaxDistance-this.config.transitionDistance;this.submittedFarInstances=0;for(const a of e){if(a.bounds.clampPoint(this.cameraPosition,this.closestPoint),a.distance=this.cameraPosition.distanceTo(this.closestPoint),a.distance>=t){a.inFrustum=!1,a.mesh.visible=!1;continue}if(a.inFrustum=this.frustum.intersectsBox(a.bounds),!a.inFrustum){a.mesh.visible=!1;continue}const o=this.cameraPosition.distanceTo(a.boundingSphere.center)+a.boundingSphere.radius;a.mesh.visible=o>s,a.mesh.visible&&(this.submittedFarInstances+=a.mesh.count)}}getSubmittedMidVertices(){return this.submittedMidVertices}getSubmittedFarInstances(){return this.submittedFarInstances}updateThreeStagePatch(e){e.lod=this.resolveLevel(e.distance,e.lod,!0),e.nearCoverage=this.resolveNearCoverage(e.distance);const t=this.resolveFarEntry(e.distance);if(e.midCoverage=Math.max(0,(1-e.nearCoverage)*(1-t)),e.farCoverage=this.resolveFarCoverage(e.distance,e.nearCoverage,t),!e.inFrustum){e.nearMesh&&(e.nearMesh.visible=!1),e.midMesh.visible=!1,e.farMesh&&(e.farMesh.visible=!1);return}const s=this.cameraPosition.distanceTo(e.boundingSphere.center)+e.boundingSphere.radius,a=this.config.nearMaxDistance-this.config.transitionDistance,o=this.config.nearMaxDistance+this.config.transitionDistance,i=this.config.midMaxDistance-this.config.transitionDistance,n=this.config.midMaxDistance+this.config.transitionDistance,d=this.config.farMaxDistance+this.config.transitionDistance;e.nearMesh&&(e.nearMesh.visible=e.distance<o),e.midMesh.visible=s>a&&e.distance<n,e.midMesh.visible&&(this.compactMidInstances(e,a,s)===0?e.midMesh.visible=!1:this.trimMidDraw(e,Math.min(s,this.compactFarthest))),e.farMesh&&(e.farMesh.visible=s>i&&e.distance<d)}trimMidDraw(e,t){const s=e.midSortedDithers;if(!s)return;const a=this.resolveNearCoverage(t),o=this.resolveFarEntry(e.distance),i=Math.max(a,o),d=1-this.midFalloff.scale*C.lerp(1,this.midFalloff.floor,C.smoothstep(e.distance,this.midFalloff.start,this.midFalloff.end))*(1-i)-ws,u=d<=0?s.length:As(s,d);e.midMesh.geometry.setDrawRange(0,u*Re),this.submittedMidVertices+=u*Re*e.midMesh.count}compactMidInstances(e,t,s){const a=e.midMesh,o=e.instanceCount;if(o<=0)return a.count=0,this.compactFarthest=0,0;if(e.distance>t)return a.count=o,this.compactFarthest=s,o;const i=a.instanceMatrix.array,n=a.geometry.getAttribute("instanceVariation"),d=a.geometry.getAttribute("instanceCoverage"),u=a.geometry.getAttribute("instanceBiome");if(!n||!d||!u)return a.count=o,this.compactFarthest=s,o;const c=n.array,g=d.array,f=u.array,v=e.baseMidCoverage,x=a.position,_=this.cameraPosition,E=this.midInstanceRadius;let G=0,R=0,A=!1;for(let b=0;b<o;b+=1){const F=b*16,P=Math.hypot(x.x+i[F+12]-_.x,x.y+i[F+13]-_.y,x.z+i[F+14]-_.z);P+E<=t||(R=Math.max(R,P),G!==b&&(A=!0,_e(i,G*16,F,16,this.matrixSwap),_e(c,G*4,b*4,4,this.variationSwap),se(g,G,b),se(f,G,b),v&&se(v,G,b)),G+=1)}return G!==a.count&&(a.count=G),A&&(a.instanceMatrix.needsUpdate=!0,n.needsUpdate=!0,d.needsUpdate=!0,u.needsUpdate=!0),this.compactFarthest=G===0?0:R,G}updateLegacyPatch(e){const t=e.nearMesh;if(t){if(e.lod=this.resolveLevel(e.distance,e.lod,!1),e.nearCoverage=this.resolveNearCoverage(e.distance),e.midDistanceFade=this.resolveLegacyMidDistanceFade(e.distance),!e.inFrustum){t.visible=!1,e.midMesh.visible=!1;return}t.visible=e.nearCoverage>ee,e.midMesh.visible=e.nearCoverage<1-ee&&e.midDistanceFade>ee}}resolveLevel(e,t,s){const a=this.config.hysteresisDistance;if(t===D.Near)return e>this.config.nearMaxDistance+a?D.Mid:D.Near;if(t===D.Mid){if(e<this.config.nearMaxDistance-a)return D.Near;const o=s?this.config.midMaxDistance:this.config.farMaxDistance;return e>o+a?s?D.Far:D.Terrain:D.Mid}return t===D.Far&&s?e<this.config.midMaxDistance-a?D.Mid:e>this.config.farMaxDistance+a?D.Terrain:D.Far:e>=this.config.farMaxDistance-a?D.Terrain:s?D.Far:D.Mid}resolveNearCoverage(e){const t=this.config.nearMaxDistance-this.config.transitionDistance,s=this.config.nearMaxDistance+this.config.transitionDistance;return 1-C.smoothstep(e,t,s)}resolveFarEntry(e){const t=this.config.midMaxDistance-this.config.transitionDistance,s=this.config.midMaxDistance+this.config.transitionDistance;return C.smoothstep(e,t,s)}resolveFarCoverage(e,t,s){const a=this.config.farMaxDistance-this.config.transitionDistance,o=this.config.farMaxDistance+this.config.transitionDistance,i=C.smoothstep(e,a,o),n=(1-t)*_s;return C.lerp(n,1,s)*(1-i)}resolveLegacyMidDistanceFade(e){const t=this.config.farMaxDistance-this.config.transitionDistance,s=this.config.farMaxDistance+this.config.transitionDistance;return 1-C.smoothstep(e,t,s)}}function se(r,e,t){const s=r[e];r[e]=r[t],r[t]=s}function _e(r,e,t,s,a){a.set(r.subarray(e,e+s)),r.copyWithin(e,t,t+s),r.set(a.subarray(0,s),t)}const j=new X(...ns).normalize(),Fs=-j.x/Math.max(j.y,.2),Ls=-j.z/Math.max(j.y,.2),we=.001;class Ns{constructor(){l(this,"disc",new k(0,0,0,1));l(this,"strengthValue",0)}set(e,t,s,a,o,i){if(!Number.isFinite(e)||!Number.isFinite(t)||!Number.isFinite(s)||!Number.isFinite(a)||!Number.isFinite(o)||!Number.isFinite(i)||a<=0||i<=we){this.clear();return}const n=Math.max(0,o);this.disc.set(e+Fs*n,t,s+Ls*n,a),this.strengthValue=Math.min(1,i)}clear(){this.strengthValue=0}get strength(){return this.strengthValue}isEnabled(){return this.strengthValue>we}}const te=new Ns,W=4,Me={resolution:256,coverage:24,recoveryRate:.5,freshnessRate:1.4},Ae=.04,Ps=.3,Is=1/30,Ws=1e-6,Fe=.1,ae=8,Bs=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,Os=`
precision highp float;

#define MAX_CONTACTS ${W}

uniform sampler2D uPrevious;
uniform vec2 uCenter;
uniform vec2 uPreviousCenter;
uniform float uCoverage;
uniform float uInitialize;
uniform float uDelta;
uniform float uRecoveryRate;
uniform float uRecoveryFloor;
uniform float uFreshnessRate;
uniform int uContactCount;
// xy world position, z radius, w strength
uniform vec4 uContacts[MAX_CONTACTS];
// xy travel direction, z inner radius fraction, w directional blend
uniform vec4 uContactShapes[MAX_CONTACTS];

varying vec2 vUv;

void main() {
  vec2 world = uCenter + (vUv - 0.5) * uCoverage;

  // Reproject through the scroll delta. Texels that just entered the covered
  // square have no history and read neutral.
  vec2 previousUv = (world - uPreviousCenter) / uCoverage + 0.5;
  vec4 previous = vec4(0.5, 0.5, 0.0, 0.0);
  if (
    uInitialize < 0.5 &&
    previousUv.x >= 0.0 && previousUv.x <= 1.0 &&
    previousUv.y >= 0.0 && previousUv.y <= 1.0
  ) {
    previous = texture2D(uPrevious, previousUv);
  }

  vec2 direction = previous.rg * 2.0 - 1.0;
  // Exponential decay alone leaves faint crush hanging around forever, and on
  // the 8-bit fallback target it freezes outright: below roughly 0.24 the
  // per-frame decrement rounds to zero and the texel never recovers. The linear
  // floor term guarantees the field returns to neutral in bounded time.
  float crush = max(
    0.0,
    previous.b * exp(-uRecoveryRate * uDelta) - uRecoveryFloor * uDelta
  );
  float freshness = max(0.0, previous.a - uFreshnessRate * uDelta);

  float appliedCrush = 0.0;
  vec2 appliedDirection = vec2(0.0);
  for (int index = 0; index < MAX_CONTACTS; index += 1) {
    if (index >= uContactCount) {
      break;
    }
    vec4 contact = uContacts[index];
    vec4 shape = uContactShapes[index];
    vec2 offset = world - contact.xy;
    // Contacts occupy well under one percent of the trail square. Reject the
    // other texels before paying for sqrt and the smoothstep falloffs.
    float distanceSquared = dot(offset, offset);
    float radiusSquared = contact.z * contact.z;
    if (distanceSquared >= radiusSquared) {
      continue;
    }
    float distanceToContact = sqrt(distanceSquared);
    // A disc for footfalls (inner = 0); a ring for the expanding landing pulse.
    float inner = contact.z * shape.z;
    float ringMask = inner > 0.0
      ? smoothstep(inner * 0.4, inner, distanceToContact)
      : 1.0;
    float falloff =
      ringMask *
      (1.0 - smoothstep(max(inner, contact.z * 0.25), contact.z, distanceToContact));
    float amount = falloff * contact.w;
    if (amount <= 0.0) {
      continue;
    }
    vec2 away = distanceToContact > 1e-4
      ? offset / distanceToContact
      : shape.xy;
    vec2 push = mix(away, shape.xy, shape.w);
    float pushLength = length(push);
    push = pushLength > 1e-4 ? push / pushLength : away;
    appliedDirection += push * amount;
    appliedCrush = max(appliedCrush, amount);
  }

  if (appliedCrush > 0.0) {
    float appliedLength = length(appliedDirection);
    vec2 newDirection = appliedLength > 1e-4
      ? appliedDirection / appliedLength
      : direction;
    // A stronger contact overrides the stored lay of the grass; a weaker one
    // only nudges it, so a light brush does not undo a deep footprint.
    float authority = appliedCrush / max(crush, appliedCrush);
    direction = mix(direction, newDirection, clamp(authority, 0.0, 1.0));
    float directionLength = length(direction);
    direction = directionLength > 1e-4 ? direction / directionLength : newDirection;
    crush = max(crush, appliedCrush);
    freshness = max(freshness, appliedCrush);
  }

  gl_FragColor = vec4(direction * 0.5 + 0.5, clamp(crush, 0.0, 1.0), clamp(freshness, 0.0, 1.0));
}
`;class Us{constructor(){l(this,"config",{...Me});l(this,"inverseCoverage",1/Me.coverage);l(this,"renderer");l(this,"targets");l(this,"readTarget",0);l(this,"recoveryFloorRatio",Ae);l(this,"scene",new ls);l(this,"camera",new us(-1,1,1,-1,0,1));l(this,"center",new M);l(this,"previousCenter",new M);l(this,"focus",new M);l(this,"contacts",new Float32Array(W*ae));l(this,"contactCount",0);l(this,"accumulatedDeltaSeconds",0);l(this,"material");l(this,"quad");l(this,"hasFocus",!1);l(this,"enabled",!1)}configure(e){const t={...this.config,...e};if(Vs(t),this.config=t,this.inverseCoverage=1/this.config.coverage,this.renderer){const s=this.renderer;this.releaseTargets(),this.attach(s)}}attach(e){if(this.targets){if(this.renderer===e)return;this.releaseTargets()}this.renderer=e;const t=[];let s;try{const a=this.targetSize(),o=zs(e);this.recoveryFloorRatio=o===Ue?Ae:Ps;const i=Le(a,o);t.push(i);const n=Le(a,o);t.push(n),this.targets=[i,n],t.length=0,this.material=new cs({vertexShader:Bs,fragmentShader:Os,depthTest:!1,depthWrite:!1,uniforms:{uPrevious:{value:this.targets[0].texture},uCenter:{value:new M},uPreviousCenter:{value:new M},uCoverage:{value:this.config.coverage},uInitialize:{value:0},uDelta:{value:0},uRecoveryRate:{value:this.config.recoveryRate},uRecoveryFloor:{value:this.config.recoveryRate*this.recoveryFloorRatio},uFreshnessRate:{value:this.config.freshnessRate},uContactCount:{value:0},uContacts:{value:Array.from({length:W},()=>new k)},uContactShapes:{value:Array.from({length:W},()=>new k(0,1,0,0))}}}),s=new ds(2,2),this.quad=new hs(s,this.material),s=void 0,this.quad.frustumCulled=!1,this.scene.add(this.quad),this.enabled=!0,this.primeTargets()}catch(a){try{$(t)}catch(o){console.warn("[Drusniel World] Pending grass trail target cleanup failed.",o)}if(s)try{s.dispose()}catch(o){console.warn("[Drusniel World] Pending grass trail geometry cleanup failed.",o)}try{this.releaseTargets()}catch(o){console.warn("[Drusniel World] Grass trail attach cleanup failed.",o)}throw this.renderer=void 0,a}}setFocus(e,t){!Number.isFinite(e)||!Number.isFinite(t)||(this.focus.set(e,t),this.hasFocus=!0)}submitContact(e,t,s,a,o,i,n,d){if(!Hs(e,t,s,a,o,i,n,d)||a<=0||s<=0||this.contactCount>=W)return;const u=this.contactCount*ae;this.contacts[u]=e,this.contacts[u+1]=t,this.contacts[u+2]=s,this.contacts[u+3]=a,this.contacts[u+4]=o,this.contacts[u+5]=i,this.contacts[u+6]=n,this.contacts[u+7]=d,this.contactCount+=1}render(e){const t=this.renderer,s=this.targets,a=this.material;if(!t||!s||!a||!this.enabled||!this.hasFocus){this.resetPendingFrame();return}if(t.getContext().isContextLost()){this.resetPendingFrame();return}if(!Number.isFinite(e)||e<=0){this.resetPendingFrame();return}if(this.accumulatedDeltaSeconds=Math.min(Fe,this.accumulatedDeltaSeconds+Math.min(e,Fe)),this.accumulatedDeltaSeconds+Ws<Is){this.contactCount=0;return}const o=this.accumulatedDeltaSeconds;this.accumulatedDeltaSeconds=0,this.previousCenter.copy(this.center);const i=this.config.coverage/this.targetSize();this.center.set(Math.round(this.focus.x/i)*i,Math.round(this.focus.y/i)*i);const n=a.uniforms;n.uPrevious.value=s[this.readTarget].texture,n.uCenter.value.copy(this.center),n.uPreviousCenter.value.copy(this.previousCenter),n.uCoverage.value=this.config.coverage,n.uDelta.value=o,n.uRecoveryRate.value=this.config.recoveryRate,n.uRecoveryFloor.value=this.config.recoveryRate*this.recoveryFloorRatio,n.uFreshnessRate.value=this.config.freshnessRate,n.uContactCount.value=this.contactCount;const d=n.uContacts.value,u=n.uContactShapes.value;for(let f=0;f<this.contactCount;f+=1){const v=f*ae;d[f].set(this.contacts[v],this.contacts[v+1],this.contacts[v+2],this.contacts[v+3]),u[f].set(this.contacts[v+4],this.contacts[v+5],C.clamp(this.contacts[v+6],0,.95),C.clamp(this.contacts[v+7],0,1))}this.contactCount=0;const c=1-this.readTarget,g=t.getRenderTarget();try{t.setRenderTarget(s[c]),t.render(this.scene,this.camera),this.readTarget=c}finally{t.setRenderTarget(g)}}isEnabled(){return this.enabled&&this.hasFocus&&this.targets!==void 0}getTexture(){var e;return((e=this.targets)==null?void 0:e[this.readTarget].texture)??null}getCenter(){return this.center}getInverseCoverage(){return this.inverseCoverage}dispose(){this.renderer=void 0,this.enabled=!1,this.hasFocus=!1,this.resetPendingFrame(),this.releaseTargets()}targetSize(){return Math.max(32,Math.round(this.config.resolution))}resetPendingFrame(){this.contactCount=0,this.accumulatedDeltaSeconds=0}releaseTargets(){const e=this.quad,t=this.material,s=this.targets;this.quad=void 0,this.material=void 0,this.targets=void 0,this.readTarget=0,this.enabled=!1,$([{dispose:()=>e==null?void 0:e.removeFromParent()},e==null?void 0:e.geometry,t,...s??[]])}primeTargets(){const e=this.renderer,t=this.targets,s=this.material;if(!e||!t||!s)return;s.uniforms.uInitialize.value=1,s.uniforms.uContactCount.value=0,s.uniforms.uDelta.value=0;const a=e.getRenderTarget();try{for(const o of t)e.setRenderTarget(o),e.render(this.scene,this.camera)}finally{e.setRenderTarget(a),s.uniforms.uInitialize.value=0}}}function Vs(r){if(!Number.isInteger(r.resolution)||r.resolution<32)throw new Error("Grass trail resolution must be an integer of at least 32.");for(const[e,t]of[["coverage",r.coverage],["recoveryRate",r.recoveryRate],["freshnessRate",r.freshnessRate]])if(!Number.isFinite(t)||t<=0)throw new Error(`Grass trail ${e} must be a positive finite number.`)}function Hs(...r){return r.every(Number.isFinite)}function zs(r){const e=r.extensions;return e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float")?Ue:Ve}function Le(r,e){const t=new ms(r,r,{format:gs,type:e,minFilter:q,magFilter:q,wrapS:Se,wrapT:Se,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1});return t.texture.colorSpace=He,t}const H=new Us,$s=1/48,Xs=.06,ks=.085,qs=.55,js=.037,Ys=.31,Ks=1.7,Zs=.72,Qs=.28,Js=.34,et=.073,st=1.45;function tt(r){return`mix(${Js.toFixed(2)}, 1.0, 0.5 + 0.5 * sin(${r} * ${et.toFixed(3)}))`}function at(r){return`fract(dot(floor(${r} * ${st.toFixed(2)}), vec2(0.1731, 0.4197)))`}function rt(r){const{target:e,position:t,windDirection:s,time:a,scale:o,speed:i}=r;return`
float ${e} = 0.5 + 0.5 * (
  sin(
    dot(${t}, ${s}) * ${o} -
    ${a} * ${i}
  ) * ${Zs.toFixed(2)} +
  sin(
    dot(
      ${t},
      vec2(-${s}.y, ${s}.x)
    ) * ${js.toFixed(3)} +
    ${a} * ${Ys.toFixed(2)} +
    ${Ks.toFixed(2)}
  ) * ${Qs.toFixed(2)}
);
`}const T=128,re=4,ie=11;function z(r,e,t){let s=Math.imul(r,374761393)^Math.imul(e,668265263)^t;return s=Math.imul(s^s>>>13,1274126177),((s^s>>>16)>>>0)/4294967296}function Ne(r,e,t,s){const a=Math.floor(r),o=Math.floor(e),i=r-a,n=e-o,d=i*i*(3-2*i),u=n*n*(3-2*n),c=(a%t+t)%t,g=(o%t+t)%t,f=(c+1)%t,v=(g+1)%t,x=z(c,g,s),_=z(f,g,s),E=z(c,v,s),G=z(f,v,s),R=x+(_-x)*d,A=E+(G-E)*d;return R+(A-R)*u}function Pe(r){return Math.max(0,Math.min(255,Math.round(r*255)))}function it(r=1597334677){const e=new Uint8Array(T*T*2);for(let s=0;s<T;s+=1)for(let a=0;a<T;a+=1){const o=a/T*re,i=s/T*re,n=Ne(o,i,re,r),d=Ne(a/T*ie,s/T*ie,ie,r^2654435769),u=(n+d*.5)/1.5,c=u*u*(3-2*u),g=(s*T+a)*2;e[g]=Pe(c),e[g+1]=Pe(d)}const t=new fs(e,T,T,vs,Ve);return t.name="grass-wind-noise",t.wrapS=Ge,t.wrapT=Ge,t.minFilter=q,t.magFilter=q,t.generateMipmaps=!1,t.colorSpace=He,t.needsUpdate=!0,t}let B;function wa(){return B||(B=it()),B}function Ma(){const r=B;B=void 0,r==null||r.dispose()}const ot=.38,nt=1,lt=1.48,ut=1.02,ct=.18,dt=.2,ht=.035,mt=.48,gt=.28,ft=.58,vt=.48,St=.92,Gt=1.04,pt=.55,Dt=0,bt=.24,Tt=.52,Ct=.42,yt=.58,m={tipStart:ot,tipEnd:nt,tipLuminanceScale:lt,dryLuminanceScale:ut,shadeDrynessPivot:ct,shadeDrynessScale:dt,shadeDrynessMaximum:ht,instanceDrynessBase:mt,instanceDrynessTip:gt,drynessMaximum:ft,rootFadeEnd:vt,shadeLightMinimum:St,shadeLightMaximum:Gt,shadowDesaturation:pt,groundContactStart:Dt,groundContactEnd:bt,groundContactStrength:Tt,groundContactBaseScale:Ct,groundContactDryScale:yt},N=new X(.2126,.7152,.0722);function h(r){if(!Number.isFinite(r))throw new TypeError("Grass palette GLSL values must be finite.");return Number.isInteger(r)?`${r}.0`:String(r)}function oe(r){return r.r*N.x+r.g*N.y+r.b*N.z}function Ie(r,e,t,s,a,o){r.set(s),e.set(a),t.set(o);const i=Math.max(oe(r),1e-4);e.multiplyScalar(i*m.tipLuminanceScale/Math.max(oe(e),1e-4)),t.multiplyScalar(i*m.dryLuminanceScale/Math.max(oe(t),1e-4))}const xt=.62,Et=h(xt),ze=`
vec3 grassResolvePalette(
  vec3 baseColor,
  vec3 tipColor,
  vec3 dryColor,
  float progress,
  float shade,
  float dryness,
  float rootAo,
  float tipColorStrength,
  float rootDarkening
) {
  float tipProfile = smoothstep(
    ${h(m.tipStart)},
    ${h(m.tipEnd)},
    progress
  );
  vec3 healthyColor = mix(
    baseColor,
    tipColor,
    tipProfile * tipColorStrength
  );
  float shadeDryness = clamp(
    (${h(m.shadeDrynessPivot)} - shade) *
      ${h(m.shadeDrynessScale)},
    0.0,
    ${h(m.shadeDrynessMaximum)}
  );
  float instanceDryness = dryness * (
    ${h(m.instanceDrynessBase)} +
    tipProfile * ${h(m.instanceDrynessTip)}
  );
  vec3 paletteColor = mix(
    healthyColor,
    dryColor,
    clamp(
      shadeDryness + instanceDryness,
      0.0,
      ${h(m.drynessMaximum)}
    )
  );
  float rootLight = mix(
    rootDarkening,
    1.0,
    smoothstep(0.0, ${h(m.rootFadeEnd)}, progress)
  );
  float bladeVariation = mix(
    ${h(m.shadeLightMinimum)},
    ${h(m.shadeLightMaximum)},
    shade
  );
  float occlusion = rootLight * bladeVariation * rootAo;
  vec3 shadedColor = paletteColor * occlusion;
  float groundContact = 1.0 - smoothstep(
    ${h(m.groundContactStart)},
    ${h(m.groundContactEnd)},
    progress
  );
  vec3 groundColor = mix(
    baseColor * ${h(m.groundContactBaseScale)},
    dryColor * ${h(m.groundContactDryScale)},
    dryness
  ) * occlusion;
  shadedColor = mix(
    shadedColor,
    groundColor,
    groundContact * ${h(m.groundContactStrength)}
  );
  // Root darkening and shade variation are scalars, so a blade can get darker
  // without its green ever getting less pure — and a dark, fully saturated
  // green is not a colour ACES can carry. Its output matrix takes red negative
  // and the clamp eats it: in a settled capture 7.5% of near-field vegetation
  // pixels had red at exactly zero, against 0.0% in the far field. That
  // clipping is most of what reads as a neon carpet rather than a meadow, and
  // no amount of palette retuning fixes it while the darkening stays purely
  // multiplicative. Ground contact mixes toward a brown/olive, but that mix is
  // still lit by the same occlusion so shadowed roots cannot lift.
  //
  // Shadowed vegetation is lit by the sky and by bounce off the ground, not by
  // nothing, so it loses saturation as it darkens. Letting it do that here puts
  // the albedo back inside the gamut as a side effect of being more correct.
  //
  // The blend runs toward the colour's own luminance, so it cannot shift the
  // field's brightness — which is what lets one shared function change every
  // LOD at once without moving the near/mid/far parity budget.
  return mix(
    shadedColor,
    vec3(dot(shadedColor, vec3(
      ${h(N.x)},
      ${h(N.y)},
      ${h(N.z)}
    ))),
    clamp(
      (1.0 - occlusion) * ${h(m.shadowDesaturation)},
      0.0,
      1.0
    )
  );
}
`,Rt=1.29,_t=12,wt=.16,Mt=.55,We=.09,At=42,Ft=18,Be=.55,Lt=.00107,Nt=1.15,Pt=3,Oe=.06,It=30,Wt=64,Aa=Object.freeze({start:28,end:62,floor:.18}),$e=`
#define GRASS_MAX_BIOMES ${Y}
uniform vec3 uGrassBiomeBase[GRASS_MAX_BIOMES];
uniform vec3 uGrassBiomeTip[GRASS_MAX_BIOMES];
uniform vec3 uGrassBiomeDry[GRASS_MAX_BIOMES];
// x: root darkening, y: tip colour strength.
uniform vec2 uGrassBiomeShade[GRASS_MAX_BIOMES];

// Indexing a uniform array out of range is undefined behaviour in GLSL ES 3.0,
// so the row is clamped rather than trusted. The data is always in range today;
// this is what keeps a future profile-count mismatch a wrong colour instead of
// a driver-dependent crash.
int grassResolveBiomeRow(float biome) {
  return int(clamp(biome, 0.0, float(GRASS_MAX_BIOMES - 1)) + 0.5);
}
`,Bt=`
attribute float grassProgress;
attribute float grassPhase;
attribute float grassBladeShade;
attribute vec4 instanceVariation;
attribute float instanceCoverage;
attribute float instanceBiome;
uniform float uGrassTime;
uniform vec2 uGrassWindDirection;
uniform float uGrassWindStrength;
uniform float uGrassGustScale;
uniform float uGrassGustSpeed;
uniform float uGrassFlutterStrength;
uniform float uGrassFlutterSpeed;
uniform float uGrassNormalUp;
uniform float uGrassWindLodScale;
uniform float uGrassDitherSeed;
uniform float uGrassNearDistance;
uniform float uGrassMidDistance;
uniform float uGrassTransitionDistance;
uniform float uGrassDetailMode;
uniform float uGrassDetailNearDistance;
uniform float uGrassDetailTransitionDistance;
uniform float uGrassLodInvert;
uniform float uGrassArtDensityScale;
uniform float uGrassBladeCurvature;
uniform float uGrassGustFrontScale;
uniform float uGrassGustFrontSpeed;
uniform float uGrassGustFrontDepth;
uniform float uGrassGustTipBoost;
uniform float uGrassSheenFadeDistance;
uniform float uGrassDensityFalloffStart;
uniform float uGrassDensityFalloffEnd;
uniform float uGrassDensityFloor;
uniform float uGrassLodDensityScale;
varying vec2 vGrassSheen;

vec3 grassRotateAroundAxis(
  vec3 value,
  vec3 axis,
  float sine,
  float cosine
) {
  return value * cosine + cross(axis, value) * sine +
    axis * dot(axis, value) * (1.0 - cosine);
}
`,Ot=`
uniform float uGrassPixelWorldScale;
uniform float uGrassMinPixelWidth;
uniform float uGrassBladeHalfWidth;
uniform float uGrassMaxWidenDistance;
`,Ut=`
uniform sampler2D uGrassTrailMap;
uniform vec2 uGrassTrailCenter;
uniform float uGrassTrailInverseCoverage;
uniform float uGrassTrailStrength;
uniform float uGrassTrailMaxAngle;
uniform float uGrassTrailWobbleFrequency;
uniform float uGrassTrailWobbleAmplitude;
uniform vec4 uGrassGroundShadowDisc;
uniform float uGrassGroundShadowStrength;
varying float vGrassGroundShade;
`,Vt=`
bool grassKeepLod;
if (uGrassLodInvert < 0.5) {
  grassKeepLod = grassDither <= grassNearCoverage * grassDensityFalloff;
} else {
  grassDensityFalloff *= mix(
    1.0,
    uGrassDensityFloor,
    smoothstep(
      uGrassDensityFalloffStart,
      uGrassDensityFalloffEnd,
      grassCameraDistance
    )
  );
  float grassLodCut = max(grassNearCoverage, grassFarDistanceEntry);
  grassKeepLod = grassDither > 1.0 - grassDensityFalloff * (1.0 - grassLodCut);
}
`,Ht=`
bool grassKeepLod = uGrassLodInvert < 0.5
  ? grassDither <= uGrassLodThreshold
  : grassDither > uGrassLodThreshold && grassDither <= uGrassDistanceFade;
`,zt=`
uniform float uGrassLodThreshold;
uniform float uGrassDistanceFade;
`,$t=`
vec3 grassWidthAxis = cross(vec3(0.0, 1.0, 0.0), objectNormal);
float grassWidthAxisLength = length(grassWidthAxis);
grassWidthAxis = grassWidthAxisLength > 0.0001
  ? grassWidthAxis / grassWidthAxisLength
  : vec3(1.0, 0.0, 0.0);
float grassSide = uv.x * 2.0 - 1.0;
objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUp));
objectNormal = normalize(
  objectNormal + grassWidthAxis * (grassSide * uGrassBladeCurvature)
);
`,Xt=`
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
flat varying float vGrassBiome;
varying float vGrassGust;
`,kt=`
// The instance's translation is its fourth column; multiplying the full matrix
// by the origin is the same value for eight times the work, per vertex.
vec4 grassWorldRoot = modelMatrix * vec4(instanceMatrix[3].xyz, 1.0);
float grassDither = fract(
  grassBladeShade * 0.754877666 +
  grassPhase * 0.569840296 +
  GRASS_DITHER_INSTANCE_TERM
  uGrassDitherSeed
);
GRASS_GUST_NOISE
float grassFieldDither = fract(
  grassBladeShade * 0.438289 +
  grassPhase * 0.819173 +
  instanceVariation.x * 0.347193 +
  uGrassDitherSeed * 1.618034
);
// Motion phase is deliberately a *separate* quantity from the dithers above.
//
// The single-blade layers instance one source blade, so its grassPhase is the
// same 0.5 for every near instance: flutter timing and stiffness were therefore
// synchronised across the whole near field, which on compact — where the gust
// source is a single coherent sine — reads as rows of grass bending together.
// Folding in the per-instance variation decorrelates both.
//
// It must not be substituted into either dither: the mid layer's CPU draw
// truncation reproduces grassDither exactly and depends on it carrying no
// per-instance term, so LOD selection and motion have to stay independent.
float grassMotionPhase = fract(grassPhase + instanceVariation.x);
float grassCameraDistance = distance(cameraPosition, grassWorldRoot.xyz);
float grassMicroFade = 1.0 - smoothstep(
  uGrassNearDistance * 0.16,
  uGrassNearDistance * 0.52,
  grassCameraDistance
);
float grassNearCoverage = 1.0 - smoothstep(
  uGrassNearDistance - uGrassTransitionDistance,
  uGrassNearDistance + uGrassTransitionDistance,
  grassCameraDistance
);
float grassFarDistanceEntry = smoothstep(
  uGrassMidDistance - uGrassTransitionDistance,
  uGrassMidDistance + uGrassTransitionDistance,
  grassCameraDistance
);
float grassDetailCoverage = 1.0 - smoothstep(
  uGrassDetailNearDistance - uGrassDetailTransitionDistance,
  uGrassDetailNearDistance + uGrassDetailTransitionDistance,
  grassCameraDistance
);
// Starts at the quality governor's global scale and, for the mid layer, picks
// up the distance falloff inside the keep test below. The sub-pixel width clamp
// reads the final value to widen the survivors by the area the thinning gave up.
float grassDensityFalloff = uGrassLodDensityScale;
GRASS_KEEP_LOD
bool grassKeepDetail = uGrassDetailMode < 0.5 ||
  (uGrassDetailMode < 1.5
    ? grassDither > grassDetailCoverage
    : grassDither <= grassDetailCoverage);
// instanceCoverage carries both the per-instance field coverage and the
// streaming fade-in. Both used to be separate uniforms, but three only uploads
// a shared material's uniforms once per contiguous run of draws, so per-mesh
// values never reached the GPU. Per-instance data has no such problem.
bool grassKeepBlade =
  grassKeepLod &&
  grassKeepDetail &&
  grassFieldDither <= min(instanceCoverage * uGrassArtDensityScale, 1.0);

if (!grassKeepBlade) {
  // Every vertex in a blade shares the keep decision, so a rejected blade
  // collapses to a zero-area triangle and is dropped at primitive assembly.
  // This is the only place blades are rejected: evaluating it here rather than
  // as a fragment discard is what lets the fragment shader stay early-Z
  // friendly, and it is also exact, since the decision no longer depends on
  // interpolating a constant varying across the triangle.
  transformed = vec3(0.0);
}

GRASS_SHEEN_VARYING

float grassCoverage = 1.0;
GRASS_GROUND_SHADE_INIT
GRASS_SUBPIXEL_WIDTH

if (grassKeepBlade && grassProgress > 0.001) {
  vec2 grassWindDirection = uGrassWindDirection;
  mat3 grassInstanceBasis = mat3(instanceMatrix);
  float grassHorizontalScale = max(length(grassInstanceBasis[0]), 0.0001);
  float grassVerticalScale = max(length(grassInstanceBasis[1]), 0.0001);
  float grassDepthScale = max(length(grassInstanceBasis[2]), 0.0001);
  // A gust front travelling along the wind, tens of metres between crests.
  // Weather and tuft phase keep neighbouring blades in a clump moving together
  // while neighbouring tufts and calm stretches still differ. The envelope only
  // ever scales the bend down, which is what lets the reserved bounds and the
  // configured wind strength keep their existing meaning.
  float grassWeather = ${tt("uGrassTime")};
  float grassTuftPhase = ${at("grassWorldRoot.xz")};
  float grassGustEnvelope =
    mix(1.0 - uGrassGustFrontDepth, 1.0, grassGustNoise) * grassWeather;
  float grassGust = sin(
    dot(grassWorldRoot.xz, grassWindDirection) / uGrassGustScale +
    uGrassTime * uGrassGustSpeed +
    grassTuftPhase * 1.15 +
    instanceVariation.x * 0.42
  );
  float grassFlutter = GRASS_FLUTTER_TERM;
  float grassStiffness = mix(
    0.76,
    1.12,
    fract(grassTuftPhase * 1.61803398875 + instanceVariation.x * 0.31)
  ) * mix(1.0, 0.72, instanceVariation.w);
  float grassBend = (
    grassGust * uGrassWindStrength +
    grassFlutter * uGrassFlutterStrength * grassMicroFade
  ) * instanceVariation.y * grassStiffness * pow(grassProgress, 1.65) *
    uGrassWindLodScale * grassGustEnvelope;
  vec3 grassWorldWind = vec3(grassWindDirection.x, 0.0, grassWindDirection.y);
  // Rotate about the root instead of translating the vertex. Translation makes
  // a bent blade longer than a straight one; the trail bend below documents
  // that as the source of the rubbery look and was rewritten to rotate, but the
  // wind path kept the old form and stretched every blade it moved.
  vec2 grassWindLocal = vec2(
    dot(grassWorldWind, grassInstanceBasis[0] / grassHorizontalScale),
    dot(grassWorldWind, grassInstanceBasis[2] / grassDepthScale)
  );
  float grassWindSin = sin(grassBend);
  float grassWindCos = cos(grassBend);
  float grassWindHeight = transformed.y;
  transformed.x += grassWindLocal.x * grassWindHeight * grassWindSin *
    (grassVerticalScale / grassHorizontalScale);
  transformed.z += grassWindLocal.y * grassWindHeight * grassWindSin *
    (grassVerticalScale / grassDepthScale);
  transformed.y *= grassWindCos;
  vec3 grassWindAxis = vec3(grassWindLocal.y, 0.0, -grassWindLocal.x);
  float grassWindAxisLength = length(grassWindAxis);
  if (grassWindAxisLength > 0.0001) {
    vec3 grassWindAxisView = normalize(
      mat3(modelViewMatrix) * grassInstanceBasis *
        (grassWindAxis / grassWindAxisLength)
    );
    vNormal = normalize(grassRotateAroundAxis(
      vNormal,
      grassWindAxisView,
      grassWindSin,
      grassWindCos
    ));
  }
GRASS_TRAIL_BEND
}

if (grassKeepBlade) {
vNormal = normalize(mix(
  vNormal,
  normalize(mat3(modelViewMatrix) * vec3(0.0, 1.0, 0.0)),
  (1.0 - grassMicroFade) * 0.78
));
}

`,qt=`
vGrassSheen = vec2(
  (1.0 - smoothstep(
    uGrassSheenFadeDistance * 0.55,
    uGrassSheenFadeDistance,
    grassCameraDistance
  )) * (0.45 + 0.85 * grassGustNoise),
  mix(0.55, 1.0, grassProgress)
);
`,jt=`
vGrassSheen = vec2(0.0, mix(0.55, 1.0, grassProgress));
`,Yt=`
vec2 grassGustUv = grassWorldRoot.xz * uGrassWindNoiseScale -
  uGrassWindDirection * (uGrassTime * uGrassWindNoiseSpeed);
float grassGustNoise = texture2D(uGrassWindNoise, grassGustUv).r;
`,Kt=rt({target:"grassGustNoise",position:"grassWorldRoot.xz",windDirection:"uGrassWindDirection",time:"uGrassTime",scale:"uGrassGustFrontScale",speed:"uGrassGustFrontSpeed"}),Zt=`
uniform sampler2D uGrassWindNoise;
uniform float uGrassWindNoiseScale;
uniform float uGrassWindNoiseSpeed;
`,Qt=`
if (grassKeepBlade) {
  float grassWidthScale = max(length(vec3(instanceMatrix[0])), 0.0001);
  float grassSourceHalfWidth = uGrassBladeHalfWidth * grassWidthScale;
  // inversesqrt(falloff) is the width a survivor needs to cover the ground its
  // dropped neighbours used to. Thinning without it would read as the field
  // going bald with distance; thinning with it is invisible, and the colour
  // payback below keeps average brightness flat across the LOD handoff.
  float grassTargetHalfWidth = min(
    grassCameraDistance * uGrassPixelWorldScale * uGrassMinPixelWidth * 0.5 *
      inversesqrt(max(grassDensityFalloff, 0.04)),
    uGrassMaxWidenDistance
  );
  float grassWidenedHalfWidth = max(grassSourceHalfWidth, grassTargetHalfWidth);
  grassCoverage = grassSourceHalfWidth / grassWidenedHalfWidth;
  // grassSide is 0 at the single-triangle blade's apex, so the blade widens at
  // the base and keeps its point.
  transformed += grassWidthAxis *
    (grassSide * (grassWidenedHalfWidth - grassSourceHalfWidth) / grassWidthScale);
}
`,Jt=`
  // Contact occlusion under the character. Grass takes no part in the shadow
  // map (see GrassGroundShadow), so without this the field stays fully lit right
  // up to the feet standing in it and the character reads as a decal.
  //
  // Two falloffs, because a body near the ground occludes two different things.
  // Across the ground it is a soft disc, squared so the darkest part stays
  // small and the edge stays wide. Up the blade it is strongest at the root and
  // gone by the tip: the sky the root cannot see is most of what lights it,
  // while a tip standing clear of the disc is lit normally. Fading it out that
  // way also hides the disc's edge, which is the tell on a fake like this.
  if (uGrassGroundShadowStrength > 0.0) {
    vec2 grassGroundOffset = grassWorldRoot.xz - uGrassGroundShadowDisc.xz;
    float grassGroundRadius = max(uGrassGroundShadowDisc.w, 0.0001);
    float grassGroundFalloff = 1.0 - saturate(
      length(grassGroundOffset) / grassGroundRadius
    );
    if (grassGroundFalloff > 0.0) {
      // The root's own height above the contact point, so grass on a bank above
      // the character does not darken as if it were underfoot.
      float grassGroundLift = 1.0 - saturate(
        abs(grassWorldRoot.y - uGrassGroundShadowDisc.y) * 0.6
      );
      vGrassGroundShade = 1.0 -
        grassGroundFalloff * grassGroundFalloff * grassGroundLift *
        uGrassGroundShadowStrength * (1.0 - grassProgress * 0.72);
    }
  }
  if (uGrassTrailStrength > 0.0) {
    // The AABB reject is the whole early-out: two compares before any fetch,
    // and the trail square only ever covers a couple of dozen metres around the
    // character while this layer draws every blade in the near band.
    vec2 grassTrailUv =
      (grassWorldRoot.xz - uGrassTrailCenter) * uGrassTrailInverseCoverage + 0.5;
    vec2 grassTrailInside = step(vec2(0.0), grassTrailUv) * step(grassTrailUv, vec2(1.0));
    if (grassTrailInside.x * grassTrailInside.y > 0.0) {
      vec4 grassTrailSample = texture2D(uGrassTrailMap, grassTrailUv);
      float grassTrailCrush = grassTrailSample.b;
      vec2 grassTrailDirection = grassTrailSample.rg * 2.0 - 1.0;
      float grassTrailDirectionLength = length(grassTrailDirection);
      if (grassTrailCrush > 0.004 && grassTrailDirectionLength > 0.02) {
        grassTrailDirection /= grassTrailDirectionLength;
        // Blades differ in how hard they resist, so a footprint is not a
        // uniformly flattened disc. This mixes in instanceVariation as well as
        // grassPhase: the single-blade layers instance one source blade, so a
        // phase-only seed would be identical for every blade in the field.
        float grassTrailSeed = fract(instanceVariation.x * 3.719 + grassPhase * 2.61803398875);
        float grassTrailStiffness = mix(1.22, 0.78, grassTrailSeed);
        // Saturating: blades directly under a foot flatten hard without the
        // response running away and pushing them through the ground.
        float grassTrailResponse = 1.0 - exp(-3.4 * grassTrailCrush * grassTrailStiffness);
        // Alpha is contact recency, re-seeded for as long as a contact covers
        // the texel, so this rings hardest while a foot is working the grass
        // and dies away over the second or so after it lifts.
        float grassTrailWobble = 1.0 + uGrassTrailWobbleAmplitude * grassTrailSample.a *
          sin(uGrassTime * uGrassTrailWobbleFrequency + grassTrailSeed * 6.28318530718);
        float grassHabitatBend = mix(
          0.7,
          1.22,
          saturate((grassVerticalScale - 0.68) * 1.9)
        ) * (1.0 - instanceVariation.w * 0.48);
        float grassTrailAngle = clamp(
          uGrassTrailMaxAngle * uGrassTrailStrength * grassTrailResponse *
            grassTrailWobble * grassHabitatBend,
          0.0,
          1.48
        );
        // The angle grows towards the tip, so the blade curves instead of
        // tilting rigidly out of the ground.
        float grassTrailTheta = grassTrailAngle * pow(grassProgress, 0.85);
        float grassTrailSin = sin(grassTrailTheta);
        float grassTrailCos = cos(grassTrailTheta);
        vec3 grassTrailWorld = vec3(grassTrailDirection.x, 0.0, grassTrailDirection.y);
        vec2 grassTrailLocal = vec2(
          dot(grassTrailWorld, grassInstanceBasis[0] / grassHorizontalScale),
          dot(grassTrailWorld, grassInstanceBasis[2] / grassDepthScale)
        );
        // World height of this vertex is localY * verticalScale; a rotation by
        // theta moves it localY * verticalScale * sin(theta) horizontally and
        // leaves localY * cos(theta) of local height. Converting the horizontal
        // part back through the instance's own scales keeps non-uniformly
        // scaled blades correct.
        float grassTrailHeight = transformed.y;
        transformed.x += grassTrailLocal.x * grassTrailHeight * grassTrailSin *
          (grassVerticalScale / grassHorizontalScale);
        transformed.z += grassTrailLocal.y * grassTrailHeight * grassTrailSin *
          (grassVerticalScale / grassDepthScale);
        transformed.y *= grassTrailCos;
        vec3 grassTrailAxis = vec3(
          grassTrailLocal.y,
          0.0,
          -grassTrailLocal.x
        );
        float grassTrailAxisLength = length(grassTrailAxis);
        if (grassTrailAxisLength > 0.0001) {
          vec3 grassTrailAxisView = normalize(
            mat3(modelViewMatrix) * grassInstanceBasis *
              (grassTrailAxis / grassTrailAxisLength)
          );
          vNormal = normalize(grassRotateAroundAxis(
            vNormal,
            grassTrailAxisView,
            grassTrailSin,
            grassTrailCos
          ));
        }
      }
    }
  }
`,ea=`
vGrassProgress = grassProgress;
vGrassShade = mix(grassBladeShade, 0.5, (1.0 - grassMicroFade) * 0.86);
vGrassDryness = instanceVariation.w;
vGrassRootAo = instanceVariation.z;
vGrassBiome = instanceBiome;
vGrassGust = grassGustNoise;
`,sa=`
int grassBiomeRow = grassResolveBiomeRow(instanceBiome);
vec3 grassPaletteColor = grassResolvePalette(
  uGrassBiomeBase[grassBiomeRow],
  uGrassBiomeTip[grassBiomeRow],
  uGrassBiomeDry[grassBiomeRow],
  grassProgress,
  mix(grassBladeShade, 0.5, (1.0 - grassMicroFade) * 0.86),
  instanceVariation.w,
  instanceVariation.z,
  uGrassBiomeShade[grassBiomeRow].y,
  uGrassBiomeShade[grassBiomeRow].x
);
grassPaletteColor = mix(
  grassPaletteColor,
  uGrassBiomeTip[grassBiomeRow],
  grassGustNoise * uGrassGustTipBoost * grassProgress
);
vGrassColor = mix(grassPaletteColor, uGrassCanopyColor, 1.0 - grassCoverage);
vGrassProgress = grassProgress;
vGrassDryness = instanceVariation.w;
`,ta=`
${$e}
uniform vec3 uGrassCanopyColor;
varying vec3 vGrassColor;
varying float vGrassProgress;
varying float vGrassDryness;
${ze}
`,aa=`
${$e}
uniform vec3 uGrassTipColor;
uniform float uGrassGustTipBoost;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
uniform float uGrassSheenStrength;
uniform float uGrassSheenPower;
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
flat varying float vGrassBiome;
varying float vGrassGust;
varying vec2 vGrassSheen;
${ze}
`,ra=`
varying float vGrassGroundShade;
`,ia=`
diffuseColor.rgb *= vGrassGroundShade;
`,oa=`
uniform vec3 uGrassTipColor;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
uniform float uGrassSheenStrength;
uniform float uGrassSheenPower;
varying vec3 vGrassColor;
varying vec2 vGrassSheen;
varying float vGrassProgress;
varying float vGrassDryness;
`,na=`
#include <color_fragment>
diffuseColor.rgb = vGrassColor;
GRASS_GROUND_SHADE_APPLY
reflectedLight.indirectDiffuse += diffuseColor.rgb * uGrassAmbientBoost;
`,la=`
#include <color_fragment>
int grassBiomeRow = grassResolveBiomeRow(vGrassBiome);
diffuseColor.rgb = grassResolvePalette(
  uGrassBiomeBase[grassBiomeRow],
  uGrassBiomeTip[grassBiomeRow],
  uGrassBiomeDry[grassBiomeRow],
  vGrassProgress,
  vGrassShade,
  vGrassDryness,
  vGrassRootAo,
  uGrassBiomeShade[grassBiomeRow].y,
  uGrassBiomeShade[grassBiomeRow].x
);
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  uGrassBiomeTip[grassBiomeRow],
  vGrassGust * uGrassGustTipBoost * vGrassProgress
);
GRASS_GROUND_SHADE_APPLY
reflectedLight.indirectDiffuse += diffuseColor.rgb * uGrassAmbientBoost;
`,ua=`
float grassBackLight = 0.0;
vec3 grassSheen = vec3(0.0);
#if NUM_DIR_LIGHTS > 0
  vec3 grassViewDirection = normalize(vViewPosition);
  vec3 grassSunDirection = directionalLights[0].direction;
  // Transmission, not a rim. Light has to reach the camera through the blade,
  // so the sun must be behind it, the blade must be turned edge-on to the sun,
  // and a thin tip passes more of it than the thick base. The term this
  // replaces had only the first of those three and so lit every blade facing
  // the camera equally, which reads as a plastic outline rather than a leaf.
  float grassIntoSun = saturate(dot(-grassViewDirection, grassSunDirection));
  float grassThinness = 1.0 - abs(dot(normal, grassSunDirection));
  float grassRootAttenuation = smoothstep(0.12, 0.72, vGrassProgress);
  float grassViewFacing = saturate(dot(normal, grassViewDirection));
  float grassWetTransmission = mix(0.78, 1.14, 1.0 - vGrassDryness);
  grassBackLight = min(
    grassIntoSun * grassIntoSun * grassThinness * grassRootAttenuation *
      (0.35 + 0.65 * grassViewFacing) * vGrassSheen.y * grassWetTransmission,
    0.82
  );
GRASS_SHEEN_OUTPUT
#endif
vec3 grassLambertLight =
  reflectedLight.directDiffuse +
  reflectedLight.indirectDiffuse +
  totalEmissiveRadiance;
vec3 outgoingLight =
  mix(diffuseColor.rgb, grassLambertLight, ${Et}) +
  mix(diffuseColor.rgb, uGrassTipColor, 0.35) *
    grassBackLight * uGrassBacklightStrength +
  grassSheen;
`,ca=`
  // Skip both the half-vector normalization and the high-power lobe once the
  // contribution has faded. This branch is coherent across distant quads.
  if (vGrassSheen.x > 0.001) {
    vec3 grassSunPlusView = grassSunDirection + grassViewDirection;
    vec3 grassHalfVector = length(grassSunPlusView) > 1e-4
      ? normalize(grassSunPlusView)
      : normal;
    grassSheen = directionalLights[0].color * (
      pow(saturate(dot(normal, grassHalfVector)), uGrassSheenPower) *
      uGrassSheenStrength * vGrassSheen.x
    );
  }
`,da=`
    sin(
      dot(grassWorldRoot.xz, vec2(-grassWindDirection.y, grassWindDirection.x)) /
        (uGrassGustScale * 0.37) +
      uGrassTime * uGrassFlutterSpeed +
      grassMotionPhase * 6.28318530718
    ) * mix(0.72, 1.18, instanceVariation.w)
`;function ne(r){return Array.from({length:Y},()=>new le(r))}function ha(r,e){return Array.from({length:Y},()=>new M(r,e))}class Fa{constructor(e){l(this,"material");l(this,"colorControls",{baseColor:"#273f22",tipColor:"#83a96b",dryColor:"#a8a06a"});l(this,"uniforms",{uGrassTime:{value:0},uGrassWindDirection:{value:new M(.8,.35).normalize()},uGrassWindStrength:{value:.14},uGrassGustScale:{value:.08},uGrassGustSpeed:{value:.65},uGrassFlutterStrength:{value:.035},uGrassFlutterSpeed:{value:3.4},uGrassBiomeBase:{value:ne(this.colorControls.baseColor)},uGrassBiomeTip:{value:ne(this.colorControls.tipColor)},uGrassBiomeDry:{value:ne(this.colorControls.dryColor)},uGrassBiomeShade:{value:ha(.55,.5)},uGrassTipColor:{value:new le(this.colorControls.tipColor)},uGrassNormalUp:{value:.45},uGrassAmbientBoost:{value:.12},uGrassBacklightStrength:{value:.16},uGrassLodInvert:{value:0},uGrassLodThreshold:{value:1},uGrassDistanceFade:{value:1},uGrassDitherSeed:{value:0},uGrassWindLodScale:{value:1},uGrassNearDistance:{value:0},uGrassMidDistance:{value:0},uGrassTransitionDistance:{value:1},uGrassDetailMode:{value:0},uGrassDetailNearDistance:{value:0},uGrassDetailTransitionDistance:{value:1},uGrassArtDensityScale:{value:1},uGrassCanopyColor:{value:new le("#4d923f")},uGrassBladeCurvature:{value:Mt},uGrassSheenStrength:{value:We},uGrassSheenPower:{value:At},uGrassSheenFadeDistance:{value:Ft},uGrassGustFrontScale:{value:ks},uGrassGustFrontSpeed:{value:qs},uGrassGustFrontDepth:{value:Be},uGrassGustTipBoost:{value:Ee},uGrassWindNoise:{value:null},uGrassWindNoiseScale:{value:$s},uGrassWindNoiseSpeed:{value:Xs},uGrassDensityFalloffStart:{value:It},uGrassDensityFalloffEnd:{value:Wt},uGrassDensityFloor:{value:1},uGrassLodDensityScale:{value:1},uGrassPixelWorldScale:{value:Lt},uGrassMinPixelWidth:{value:Nt},uGrassBladeHalfWidth:{value:.017},uGrassMaxWidenDistance:{value:Oe},uGrassTrailMap:{value:null},uGrassTrailCenter:{value:new M},uGrassTrailInverseCoverage:{value:1},uGrassTrailStrength:{value:0},uGrassTrailMaxAngle:{value:Rt},uGrassTrailWobbleFrequency:{value:_t},uGrassTrailWobbleAmplitude:{value:wt},uGrassGroundShadowDisc:{value:new k(0,0,0,1)},uGrassGroundShadowStrength:{value:0}});l(this,"interactive");l(this,"baseWindStrength",.14);l(this,"baseFlutterStrength",.035);l(this,"artRootDarkening",.55);l(this,"artTipColorStrength",.5);this.interactive=e.interactive===!0,this.uniforms.uGrassLodInvert.value=e.invertLodCoverage?1:0,this.uniforms.uGrassWindLodScale.value=e.windLodScale??1,this.uniforms.uGrassDetailMode.value=e.detailMode??0,this.uniforms.uGrassDitherSeed.value=(e.ditherSeed??0)/4294967296,this.setPaletteColors(),this.material=new Ss({side:Gs,color:16777215,transparent:!1,depthWrite:!0}),this.material.name=e.name;const t=e.vertexPalette===!0,s=e.worldLod!==!1,a=e.subPixelWidth===!0,o=e.sheen!==!1,i=e.noiseWind===!0,n=e.microWind!==!1,d=e.instanceFreeDither===!0,u=s?Vt:Ht;this.material.onBeforeCompile=c=>{Object.assign(c.uniforms,this.uniforms),c.vertexShader=c.vertexShader.replace("#include <common>",`#include <common>${Bt}${this.interactive?Ut:""}${s?"":zt}${a?Ot:""}${i?Zt:""}${t?ta:Xt}`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>${$t}`).replace("#include <begin_vertex>",`#include <begin_vertex>${kt.replace("GRASS_KEEP_LOD",u).replace("GRASS_DITHER_INSTANCE_TERM",d?"":"instanceVariation.x +").replace("GRASS_GUST_NOISE",i?Yt:Kt).replace("GRASS_FLUTTER_TERM",n?da:"0.0").replace("GRASS_SHEEN_VARYING",o?qt:jt).replace("GRASS_SUBPIXEL_WIDTH",a?Qt:"").replace("GRASS_TRAIL_BEND",this.interactive?Jt:"").replace("GRASS_GROUND_SHADE_INIT",this.interactive?"vGrassGroundShade = 1.0;":"")}${t?sa:ea}`),c.fragmentShader=c.fragmentShader.replace("#include <common>",`#include <common>${t?oa:aa}${this.interactive?ra:""}`).replace("#include <color_fragment>",(t?na:la).replace("GRASS_GROUND_SHADE_APPLY",this.interactive?ia:"")).replace("vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",ua.replace("GRASS_SHEEN_OUTPUT",o?ca:""))},this.material.customProgramCacheKey=()=>e.cacheKey}configure(e,t){this.colorControls.baseColor=e.baseColor,this.colorControls.tipColor=e.tipColor,this.colorControls.dryColor=e.dryColor,this.artRootDarkening=e.rootDarkening,this.setPaletteColors(),this.uniforms.uGrassNormalUp.value=e.normalUp,this.uniforms.uGrassAmbientBoost.value=e.ambientBoost,this.uniforms.uGrassBacklightStrength.value=e.backlightStrength,this.uniforms.uGrassWindDirection.value.set(t.directionX,t.directionZ).normalize(),this.baseWindStrength=t.strength,this.baseFlutterStrength=t.flutterStrength,this.uniforms.uGrassWindStrength.value=t.strength,this.uniforms.uGrassGustScale.value=t.gustScale,this.uniforms.uGrassGustSpeed.value=t.gustSpeed,this.uniforms.uGrassFlutterStrength.value=t.flutterStrength,this.uniforms.uGrassFlutterSpeed.value=t.flutterSpeed}applyArtDirection(e){this.colorControls.baseColor=e.baseColor,this.colorControls.tipColor=e.tipColor,this.colorControls.dryColor=e.dryColor,this.artRootDarkening=e.rootDarkening,this.artTipColorStrength=e.tipColorStrength,this.setPaletteColors(),this.uniforms.uGrassNormalUp.value=e.normalUp,this.uniforms.uGrassAmbientBoost.value=e.ambientBoost,this.uniforms.uGrassBacklightStrength.value=e.backlightStrength,this.uniforms.uGrassArtDensityScale.value=e.densityScale,this.uniforms.uGrassWindStrength.value=this.baseWindStrength*e.windStrengthScale,this.uniforms.uGrassFlutterStrength.value=this.baseFlutterStrength*e.flutterStrengthScale,this.configureGust(e.gustDepth??Be,e.gustTipBoost??Ee),this.uniforms.uGrassCanopyColor.value.set(e.terrainGrassColor),this.uniforms.uGrassSheenFadeDistance.value=e.nearDistance}setViewportPixelScale(e){Number.isFinite(e)&&e>0&&(this.uniforms.uGrassPixelWorldScale.value=e)}setBladeHalfWidth(e){const t=Math.max(e,1e-4);this.uniforms.uGrassBladeHalfWidth.value=t,this.uniforms.uGrassMaxWidenDistance.value=Math.min(t*Pt,Oe)}getDitherSeed(){return this.uniforms.uGrassDitherSeed.value}setLodThreshold(e,t=1){this.uniforms.uGrassLodThreshold.value=e,this.uniforms.uGrassDistanceFade.value=t}configureLod(e){this.uniforms.uGrassNearDistance.value=e.nearMaxDistance,this.uniforms.uGrassMidDistance.value=e.midMaxDistance,this.uniforms.uGrassTransitionDistance.value=e.transitionDistance}configureDetailLod(e){this.uniforms.uGrassDetailNearDistance.value=e.nearMaxDistance,this.uniforms.uGrassDetailTransitionDistance.value=e.transitionDistance}update(e){if(this.uniforms.uGrassTime.value=e,!!this.interactive){if(te.isEnabled()?(this.uniforms.uGrassGroundShadowDisc.value.copy(te.disc),this.uniforms.uGrassGroundShadowStrength.value=te.strength):this.uniforms.uGrassGroundShadowStrength.value=0,!H.isEnabled()){this.uniforms.uGrassTrailStrength.value=0;return}this.uniforms.uGrassTrailMap.value=H.getTexture(),this.uniforms.uGrassTrailCenter.value.copy(H.getCenter()),this.uniforms.uGrassTrailInverseCoverage.value=H.getInverseCoverage(),this.uniforms.uGrassTrailStrength.value=1}}configureTrail(e){this.uniforms.uGrassTrailMaxAngle.value=e.maxAngleRadians,this.uniforms.uGrassTrailWobbleFrequency.value=e.wobbleFrequency,this.uniforms.uGrassTrailWobbleAmplitude.value=e.wobbleAmplitude}setPaletteColors(){const e=this.uniforms.uGrassBiomeBase.value,t=this.uniforms.uGrassBiomeTip.value,s=this.uniforms.uGrassBiomeDry.value,a=this.uniforms.uGrassBiomeShade.value;Ie(e[0],t[0],s[0],this.colorControls.baseColor,this.colorControls.tipColor,this.colorControls.dryColor),a[0].set(this.artRootDarkening,this.artTipColorStrength),this.uniforms.uGrassTipColor.value.copy(t[0]);for(let o=1;o<Y;o+=1){const i=ps[o];if(!i||i.paletteSource==="art"){e[o].copy(e[0]),t[o].copy(t[0]),s[o].copy(s[0]),a[o].copy(a[0]);continue}Ie(e[o],t[o],s[o],i.baseColor,i.tipColor,i.dryColor),a[o].set(i.rootDarkening,i.tipColorStrength)}}setWindNoise(e,t,s){this.uniforms.uGrassWindNoise.value=e,this.uniforms.uGrassWindNoiseScale.value=t,this.uniforms.uGrassWindNoiseSpeed.value=s}configureDensityFalloff(e,t,s){this.uniforms.uGrassDensityFalloffStart.value=e,this.uniforms.uGrassDensityFalloffEnd.value=t,this.uniforms.uGrassDensityFloor.value=s}getDensityFalloff(){return{start:this.uniforms.uGrassDensityFalloffStart.value,end:this.uniforms.uGrassDensityFalloffEnd.value,floor:this.uniforms.uGrassDensityFloor.value}}setLodDensityScale(e){this.uniforms.uGrassLodDensityScale.value=C.clamp(e,.05,1)}getLodDensityScale(){return this.uniforms.uGrassLodDensityScale.value}configureGust(e,t){this.uniforms.uGrassGustFrontDepth.value=e,this.uniforms.uGrassGustTipBoost.value=t}setSheenEnabled(e){this.uniforms.uGrassSheenStrength.value=e?We:0}setupGUI(e,t=[]){const s=[this,...t],a=e.addFolder("Grass Props");a.addColor(this.colorControls,"baseColor").onChange(i=>{for(const n of s)n.colorControls.baseColor=i,n.setPaletteColors()}),a.addColor(this.colorControls,"tipColor").onChange(i=>{for(const n of s)n.colorControls.tipColor=i,n.setPaletteColors()}),a.addColor(this.colorControls,"dryColor").onChange(i=>{for(const n of s)n.colorControls.dryColor=i,n.setPaletteColors()});const o={value:this.artTipColorStrength};a.add(o,"value",.15,.75,.01).name("Tip Mix").onChange(i=>{for(const n of s)n.artTipColorStrength=i,n.setPaletteColors()}),a.add(this.uniforms.uGrassWindStrength,"value",0,.45,.005).name("Wind Strength").onChange(i=>{for(const n of t)n.uniforms.uGrassWindStrength.value=i}),a.add(this.uniforms.uGrassFlutterStrength,"value",0,.15,.0025).name("Tip Flutter").onChange(i=>{for(const n of t)n.uniforms.uGrassFlutterStrength.value=i}),a.add(this.uniforms.uGrassNormalUp,"value",0,.9,.01).name("Normal Up").onChange(i=>{for(const n of t)n.uniforms.uGrassNormalUp.value=i}),a.add(this.uniforms.uGrassAmbientBoost,"value",0,.4,.01).name("Ambient Boost").onChange(i=>{for(const n of t)n.uniforms.uGrassAmbientBoost.value=i}),a.add(this.uniforms.uGrassBacklightStrength,"value",0,.5,.01).name("Backlight").onChange(i=>{for(const n of t)n.uniforms.uGrassBacklightStrength.value=i}),a.add(this.uniforms.uGrassBladeCurvature,"value",0,1.2,.01).name("Blade Curve").onChange(i=>{for(const n of t)n.uniforms.uGrassBladeCurvature.value=i}),a.add(this.uniforms.uGrassSheenStrength,"value",0,.3,.005).name("Sheen").onChange(i=>{for(const n of t)n.uniforms.uGrassSheenStrength.value=i}),a.add(this.uniforms.uGrassSheenPower,"value",8,96,1).name("Sheen Focus").onChange(i=>{for(const n of t)n.uniforms.uGrassSheenPower.value=i}),a.add(this.uniforms.uGrassGustFrontDepth,"value",0,.9,.01).name("Gust Fronts").onChange(i=>{for(const n of t)n.uniforms.uGrassGustFrontDepth.value=i}),a.add(this.uniforms.uGrassGustFrontSpeed,"value",0,1.6,.01).name("Gust Speed").onChange(i=>{for(const n of t)n.uniforms.uGrassGustFrontSpeed.value=i}),a.open()}}const ma=.1;class La{constructor(){l(this,"elapsedSeconds",0)}update(e){return!Number.isFinite(e)||e<=0?this.elapsedSeconds:(this.elapsedSeconds+=Math.min(e,ma),this.elapsedSeconds)}}function Na(){const r=Math.max(1,window.innerWidth),e=Math.max(1,window.innerHeight);return{width:r,height:e,aspect:r/e}}function Pa(r){const e=window.devicePixelRatio,t=Number.isFinite(e)&&e>0?e:1;return Math.min(t,r)}export{qs as A,ks as B,wa as C,Aa as D,Ma as E,pa as G,xs as S,La as W,Da as a,Fa as b,Ra as c,_a as d,D as e,Pa as f,te as g,H as h,pe as i,Ds as j,Ta as k,xa as l,Ea as m,Ca as n,ba as o,Ee as p,Xs as q,Na as r,Ie as s,$s as t,_s as u,ze as v,Et as w,rt as x,tt as y,ya as z};
