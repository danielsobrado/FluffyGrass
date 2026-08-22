var hs=Object.defineProperty;var ms=(r,e,t)=>e in r?hs(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var c=(r,e,t)=>ms(r,typeof e!="symbol"?e+"":e,t);import{f as gs,F as fs,b as Ss,P as G,c as vs,a as M,N as _,U as Gs}from"./index-DxsyHQyZ.js";import{d as Y}from"./ResourceDisposal-DcBXNnjY.js";import{ae as ps,ad as ae,B as Ts,J as W,e as x,V as j,k as Ds,am as bs,a7 as K,S as Cs,af as ys,h as w,an as ss,ac as Es,ag as Rs,a as xs,a2 as ts,a3 as _s,a9 as ye,$ as Z,a1 as ws,Y as as,a0 as Ms,ao as As,Z as Ee,s as A,W as Fs,D as Ls}from"./three.core-BkOfymuf.js";import{a as Ns}from"./WorldEnvironmentTuning-CcONhbEx.js";import{G as J,a as Ps}from"./GrassBiomeProfile-CQnagh8R.js";const Bs=2,Re=2048,xe=4,Is=/^#[0-9a-fA-F]{6}$/,_e=1e5,we=64,Me=5e6;function Ws(r){if(r.instanceCount>_e)throw new Error(`instanceCount must not exceed ${_e}.`);if(r.geometry.variantCount>we)throw new Error(`variantCount must not exceed ${we}.`);if(r.geometry.variantCount>r.instanceCount)throw new Error("variantCount must not exceed instanceCount.");if(r.instanceCount*r.geometry.bladesPerClump*r.geometry.bladeSegments>Me)throw new Error(`Configured near-grass workload must not exceed ${Me}.`);if(r.geometry.bladesPerClump<3)throw new Error("bladesPerClump must be at least 3.");if(r.geometry.bladeSegments<2)throw new Error("bladeSegments must be at least 2.");if(r.geometry.midBladesPerClump<2)throw new Error("midBladesPerClump must be at least 2.");if(r.geometry.midBladeSegments<1)throw new Error("midBladeSegments must be at least 1.");if(r.geometry.midBladesPerClump>r.geometry.bladesPerClump)throw new Error("midBladesPerClump must not exceed bladesPerClump.");if(r.geometry.midBladeSegments>=r.geometry.bladeSegments)throw new Error("midBladeSegments must be lower than bladeSegments.");if(r.geometry.bladeHeightMin>r.geometry.bladeHeightMax)throw new Error("bladeHeightMin must be less than or equal to bladeHeightMax.");if(r.geometry.bladeWidthMin>r.geometry.bladeWidthMax)throw new Error("bladeWidthMin must be less than or equal to bladeWidthMax.");if(r.geometry.bladeLeanMin>r.geometry.bladeLeanMax)throw new Error("bladeLeanMin must be less than or equal to bladeLeanMax.");if(r.distribution.densityMin>r.distribution.densityMax)throw new Error("densityMin must be less than or equal to densityMax.");if(r.lod.nearMaxDistance>=r.lod.midMaxDistance||r.lod.midMaxDistance>=r.lod.farMaxDistance)throw new Error("Grass LOD distances must increase from near to far.");if(r.lod.transitionDistance>=r.lod.nearMaxDistance)throw new Error("transitionDistance must be lower than nearMaxDistance.");if(r.lod.hysteresisDistance>=r.lod.nearMaxDistance-r.lod.transitionDistance)throw new Error("hysteresisDistance is too large for the near LOD band.");if(Math.hypot(r.wind.directionX,r.wind.directionZ)<Number.EPSILON)throw new Error("Grass wind direction must not be zero.");for(const[t,s]of[["baseColor",r.material.baseColor],["tipColor",r.material.tipColor],["dryColor",r.material.dryColor]])if(!Is.test(s))throw new Error(`Grass config value ${t} must be a six-digit hex color.`);if(r.impostor.viewsPerAxis<2)throw new Error("impostorViewsPerAxis must be at least 2.");if(r.impostor.viewsPerAxis>16)throw new Error("impostorViewsPerAxis must not exceed 16.");if(r.impostor.frameResolution<32)throw new Error("impostorFrameResolution must be at least 32.");if(r.impostor.padding<xe)throw new Error(`impostorPadding must be at least ${xe} pixels for mip-safe atlas isolation.`);if((r.impostor.frameResolution+r.impostor.padding*2)*r.impostor.viewsPerAxis*Bs>Re)throw new Error(`Impostor atlas size must not exceed ${Re} pixels.`);if(r.impostor.cameraMargin<1)throw new Error("impostorCameraMargin must be at least 1.")}const Os="./config/grass.yaml";function Vs(){return`${Os}?v=${encodeURIComponent("v0.9.6+9b4b96b00c4e")}`}class Va{async load(e=Vs()){return this.parse(await gs(e,"grass config"))}parse(e){const t=fs.parse(e,"grass"),s=new Ss(t,"Grass"),a={instanceCount:s.number("instanceCount",M),patchSize:s.number("patchSize",G),geometry:{variantCount:s.number("variantCount",M),bladesPerClump:s.number("bladesPerClump",M),bladeSegments:s.number("bladeSegments",M),clumpRadius:s.number("clumpRadius",G),bladeHeightMin:s.number("bladeHeightMin",G),bladeHeightMax:s.number("bladeHeightMax",G),bladeWidthMin:s.number("bladeWidthMin",G),bladeWidthMax:s.number("bladeWidthMax",G),bladeLeanMin:s.number("bladeLeanMin",_),bladeLeanMax:s.number("bladeLeanMax",_),bladeCurve:s.number("bladeCurve",{minimum:0,maximum:1.2}),midBladesPerClump:s.number("midBladesPerClump",M),midBladeSegments:s.number("midBladeSegments",M),midRadiusScale:s.number("midRadiusScale",G),midHeightScale:s.number("midHeightScale",G),midWidthScale:s.number("midWidthScale",G),midLeanScale:s.number("midLeanScale",_)},distribution:{seed:s.number("seed",Gs),rootSink:s.number("rootSink",_),maxSlopeDegrees:s.number("maxSlopeDegrees",{minimum:0,maximum:89}),heightVariation:s.number("heightVariation",{minimum:0,maximum:.95}),widthVariation:s.number("widthVariation",{minimum:0,maximum:.95}),densityMin:s.number("densityMin",{minimum:0,maximum:1}),densityMax:s.number("densityMax",{minimum:0,maximum:1}),densityScale:s.number("densityScale",G)},wind:{directionX:s.number("windDirectionX"),directionZ:s.number("windDirectionZ"),strength:s.number("windStrength",_),gustScale:s.number("gustScale",G),gustSpeed:s.number("gustSpeed",_),flutterStrength:s.number("flutterStrength",_),flutterSpeed:s.number("flutterSpeed",_)},material:{baseColor:s.string("baseColor"),tipColor:s.string("tipColor"),dryColor:s.string("dryColor"),rootDarkening:s.number("rootDarkening",{minimum:0,maximum:1}),normalUp:s.number("normalUp",{minimum:0,maximum:1}),ambientBoost:s.number("ambientBoost",{minimum:0,maximum:1}),backlightStrength:s.number("backlightStrength",{minimum:0,maximum:1})},lod:{nearMaxDistance:s.number("nearMaxDistance",G),midMaxDistance:s.number("midMaxDistance",G),farMaxDistance:s.number("farMaxDistance",G),hysteresisDistance:s.number("hysteresisDistance",_),transitionDistance:s.number("transitionDistance",G)},qa:{warmupSeconds:s.number("qaWarmupSeconds",_),sampleSeconds:s.number("qaSampleSeconds",G)},impostor:{viewsPerAxis:s.number("impostorViewsPerAxis",M),frameResolution:s.number("impostorFrameResolution",M),padding:s.number("impostorPadding",vs),cameraMargin:s.number("impostorCameraMargin",G)}};return t.assertFullyConsumed(),Ws(a),Object.freeze({...a,geometry:Object.freeze(a.geometry),distribution:Object.freeze(a.distribution),wind:Object.freeze(a.wind),material:Object.freeze(a.material),lod:Object.freeze(a.lod),qa:Object.freeze(a.qa),impostor:Object.freeze(a.impostor)})}}class Us{constructor(e){c(this,"state");this.state=e>>>0}next(){this.state=this.state+1831565813>>>0;let e=this.state;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}range(e,t){return e+(t-e)*this.next()}}const Hs=Math.PI*2,Ae=2654435769,zs=1e-4;function Fe(r,e,t){const s=x.clamp(t,0,1);if(!(e>zs))return{y:r*s,z:0};const a=s*s,n=e*a,i=r/e;return{y:i*Math.sin(n),z:i*(1-Math.cos(n))}}class Ua{createLodVariants(e,t){const s={bladesPerClump:e.midBladesPerClump,bladeSegments:e.midBladeSegments,clumpRadius:e.clumpRadius*e.midRadiusScale,bladeHeightMin:e.bladeHeightMin*e.midHeightScale,bladeHeightMax:e.bladeHeightMax*e.midHeightScale,bladeWidthMin:e.bladeWidthMin*e.midWidthScale,bladeWidthMax:e.bladeWidthMax*e.midWidthScale,bladeLeanMin:e.bladeLeanMin*e.midLeanScale,bladeLeanMax:e.bladeLeanMax*e.midLeanScale,bladeCurve:e.bladeCurve};let a=[],n=[];try{return a=this.createVariants(e,e.variantCount,t),n=this.createVariants(s,e.variantCount,t^Ae),{near:a,mid:n}}catch(i){throw X([...a,...n],"LOD variant"),i}}createInstancedGeometry(e,t,s,a,n){var o,u;const i=new ps;try{e.index&&i.setIndex(e.index);for(const[f,S]of Object.entries(e.attributes))i.setAttribute(f,S);i.setAttribute("instanceVariation",(a==null?void 0:a.variation)??new ae(t,4));const d=t.length/4,h=s??new Float32Array(d).fill(1);return i.setAttribute("instanceCoverage",(a==null?void 0:a.coverage)??new ae(h,1)),i.setAttribute("instanceBiome",(a==null?void 0:a.biome)??new ae(n??new Float32Array(d),1)),i.boundingBox=((o=e.boundingBox)==null?void 0:o.clone())??null,i.boundingSphere=((u=e.boundingSphere)==null?void 0:u.clone())??null,i}catch(d){throw X([i],"instanced geometry"),d}}disposeInstancedGeometry(e,t=!1){for(const s of Object.keys(e.attributes))(t||s!=="instanceVariation"&&s!=="instanceCoverage"&&s!=="instanceBiome")&&e.deleteAttribute(s);e.setIndex(null),e.dispose()}disposeInstancedMesh(e,t=!1){const s=e.geometry;Y([{dispose:()=>this.disposeInstancedGeometry(s,t)},t?void 0:e])}createVariants(e,t,s){const a=[];try{for(let n=0;n<t;n+=1)a.push(this.createClump(e,s+n*Ae));return a}catch(n){throw X(a,"partial variant set"),n}}createClump(e,t){const s=new Us(t),a=[],n=[],i=[],o=[],u=[],d=[];for(let f=0;f<e.bladesPerClump;f+=1){const S=s.range(0,Hs),v=Math.sqrt(s.next())*e.clumpRadius,C=Math.cos(S)*v,b=Math.sin(S)*v,y=S+s.range(-.85,.85),g=Math.cos(y)*.5,D=Math.sin(y)*.5,F=-Math.sin(y),E=Math.cos(y),L=S+s.range(-.65,.65),I=s.range(e.bladeLeanMin,e.bladeLeanMax),Se=Math.cos(L)*I,ve=Math.sin(L)*I,Ge=s.range(e.bladeHeightMin,e.bladeHeightMax),ns=s.range(e.bladeWidthMin,e.bladeWidthMax),ee=s.next(),se=s.next(),pe=a.length/3;for(let N=0;N<e.bladeSegments;N+=1){const p=N/e.bladeSegments,De=p*p*(3-2*p),ds=Math.pow(1-p,.72),H=ns*ds,z=Fe(Ge,e.bladeCurve,p),be=C+Se*De+F*z.z,Ce=b+ve*De+E*z.z;a.push(be-g*H,z.y,Ce-D*H,be+g*H,z.y,Ce+D*H),n.push(0,p,1,p),i.push(p,p),o.push(ee,ee),u.push(se,se)}const te=Fe(Ge,e.bladeCurve,1),ls=C+Se+F*te.z,us=b+ve+E*te.z,cs=a.length/3;a.push(ls,te.y,us),n.push(.5,1),i.push(1),o.push(ee),u.push(se);for(let N=0;N<e.bladeSegments-1;N+=1){const p=pe+N*2;d.push(p,p+2,p+1,p+2,p+3,p+1)}const Te=pe+(e.bladeSegments-1)*2;d.push(Te,cs,Te+1)}const h=new Ts;try{return h.setAttribute("position",new W(a,3)),h.setAttribute("uv",new W(n,2)),h.setAttribute("grassProgress",new W(i,1)),h.setAttribute("grassPhase",new W(o,1)),h.setAttribute("grassBladeShade",new W(u,1)),h.setIndex(d),h.computeVertexNormals(),h.computeBoundingBox(),h.computeBoundingSphere(),h}catch(f){throw X([h],"clump geometry"),f}}}function X(r,e){try{Y(r)}catch(t){console.warn(`[Drusniel World] Grass ${e} cleanup failed.`,t)}}const Xs=0,Ha=1.12,za=1.1,Xa=1.2,$a=.35,Le=.07,ka=.08,qa=.15;var T=(r=>(r[r.Near=0]="Near",r[r.Mid=1]="Mid",r[r.Far=2]="Far",r[r.Terrain=3]="Terrain",r))(T||{});class Ya{constructor(e){c(this,"patches",new Map);this.patchSize=e}keyFor(e){return this.key(Math.floor(e.x/this.patchSize),Math.floor(e.z/this.patchSize))}coordinatesFor(e){return[Math.floor(e.x/this.patchSize),Math.floor(e.z/this.patchSize)]}register(e){if(this.patches.has(e.id))throw new Error(`Grass patch ${e.id} is already registered.`);this.patches.set(e.id,e)}values(){return this.patches.values()}clear(){this.patches.clear()}key(e,t){return`${e}:${t}`}}const re=.001,$s=1/1024,Ne=3,ks=4;function qs(r,e){let t=0,s=r.length;for(;t<s;){const a=t+s>>>1;r[a]>e?t=a+1:s=a}return t}class ja{constructor(e){c(this,"cameraPosition",new j);c(this,"closestPoint",new j);c(this,"projectionViewMatrix",new Ds);c(this,"frustum",new bs);c(this,"midFalloff",{start:0,end:1,floor:1,scale:1});c(this,"submittedMidVertices",0);c(this,"submittedFarInstances",0);c(this,"midInstanceRadius",ks);c(this,"compactFarthest",0);c(this,"matrixSwap",new Float32Array(16));c(this,"variationSwap",new Float32Array(4));this.config=e}setMidDensityFalloff(e){this.midFalloff=e}setMidInstanceRadius(e){Number.isFinite(e)&&e>0&&(this.midInstanceRadius=e)}update(e,t){e.updateMatrixWorld(),e.getWorldPosition(this.cameraPosition),this.projectionViewMatrix.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projectionViewMatrix),this.submittedMidVertices=0;const s=this.config.farMaxDistance+this.config.transitionDistance;for(const a of t){if(a.bounds.clampPoint(this.cameraPosition,this.closestPoint),a.distance=this.cameraPosition.distanceTo(this.closestPoint),a.distance>=s){a.inFrustum=!1,a.nearMesh&&(a.nearMesh.visible=!1),a.midMesh.visible=!1,a.farMesh&&(a.farMesh.visible=!1);continue}a.inFrustum=this.frustum.intersectsBox(a.bounds),a.farMesh||a.hasFarImpostor?this.updateThreeStagePatch(a):this.updateLegacyPatch(a)}}updateFarGroups(e){const t=this.config.farMaxDistance+this.config.transitionDistance,s=this.config.midMaxDistance-this.config.transitionDistance;this.submittedFarInstances=0;for(const a of e){if(a.bounds.clampPoint(this.cameraPosition,this.closestPoint),a.distance=this.cameraPosition.distanceTo(this.closestPoint),a.distance>=t){a.inFrustum=!1,a.mesh.visible=!1;continue}if(a.inFrustum=this.frustum.intersectsBox(a.bounds),!a.inFrustum){a.mesh.visible=!1;continue}const n=this.cameraPosition.distanceTo(a.boundingSphere.center)+a.boundingSphere.radius;a.mesh.visible=n>s,a.mesh.visible&&(this.submittedFarInstances+=a.mesh.count)}}getSubmittedMidVertices(){return this.submittedMidVertices}getSubmittedFarInstances(){return this.submittedFarInstances}updateThreeStagePatch(e){e.lod=this.resolveLevel(e.distance,e.lod,!0),e.nearCoverage=this.resolveNearCoverage(e.distance);const t=this.resolveFarEntry(e.distance);if(e.midCoverage=Math.max(0,(1-e.nearCoverage)*(1-t)),e.farCoverage=this.resolveFarCoverage(e.distance,e.nearCoverage,t),!e.inFrustum){e.nearMesh&&(e.nearMesh.visible=!1),e.midMesh.visible=!1,e.farMesh&&(e.farMesh.visible=!1);return}const s=this.cameraPosition.distanceTo(e.boundingSphere.center)+e.boundingSphere.radius,a=this.config.nearMaxDistance-this.config.transitionDistance,n=this.config.nearMaxDistance+this.config.transitionDistance,i=this.config.midMaxDistance-this.config.transitionDistance,o=this.config.midMaxDistance+this.config.transitionDistance,u=this.config.farMaxDistance+this.config.transitionDistance;e.nearMesh&&(e.nearMesh.visible=e.distance<n),e.midMesh.visible=s>a&&e.distance<o,e.midMesh.visible&&(this.compactMidInstances(e,a,s)===0?e.midMesh.visible=!1:this.trimMidDraw(e,Math.min(s,this.compactFarthest))),e.farMesh&&(e.farMesh.visible=s>i&&e.distance<u)}trimMidDraw(e,t){const s=e.midSortedDithers;if(!s)return;const a=this.resolveNearCoverage(t),n=this.resolveFarEntry(e.distance),i=Math.max(a,n),u=1-this.midFalloff.scale*x.lerp(1,this.midFalloff.floor,x.smoothstep(e.distance,this.midFalloff.start,this.midFalloff.end))*(1-i)-$s,d=u<=0?s.length:qs(s,u);e.midMesh.geometry.setDrawRange(0,d*Ne),this.submittedMidVertices+=d*Ne*e.midMesh.count}compactMidInstances(e,t,s){const a=e.midMesh,n=e.instanceCount;if(n<=0)return a.count=0,this.compactFarthest=0,0;if(e.distance>t)return a.count=n,this.compactFarthest=s,n;const i=a.instanceMatrix.array,o=a.geometry.getAttribute("instanceVariation"),u=a.geometry.getAttribute("instanceCoverage"),d=a.geometry.getAttribute("instanceBiome");if(!o||!u||!d)return a.count=n,this.compactFarthest=s,n;const h=o.array,f=u.array,S=d.array,v=e.baseMidCoverage,C=a.position,b=this.cameraPosition,y=this.midInstanceRadius;let g=0,D=0,F=!1;for(let E=0;E<n;E+=1){const L=E*16,I=Math.hypot(C.x+i[L+12]-b.x,C.y+i[L+13]-b.y,C.z+i[L+14]-b.z);I+y<=t||(D=Math.max(D,I),g!==E&&(F=!0,Pe(i,g*16,L,16,this.matrixSwap),Pe(h,g*4,E*4,4,this.variationSwap),ie(f,g,E),ie(S,g,E),v&&ie(v,g,E)),g+=1)}return g!==a.count&&(a.count=g),F&&(a.instanceMatrix.needsUpdate=!0,o.needsUpdate=!0,u.needsUpdate=!0,d.needsUpdate=!0),this.compactFarthest=g===0?0:D,g}updateLegacyPatch(e){const t=e.nearMesh;if(t){if(e.lod=this.resolveLevel(e.distance,e.lod,!1),e.nearCoverage=this.resolveNearCoverage(e.distance),e.midDistanceFade=this.resolveLegacyMidDistanceFade(e.distance),!e.inFrustum){t.visible=!1,e.midMesh.visible=!1;return}t.visible=e.nearCoverage>re,e.midMesh.visible=e.nearCoverage<1-re&&e.midDistanceFade>re}}resolveLevel(e,t,s){const a=this.config.hysteresisDistance;if(t===T.Near)return e>this.config.nearMaxDistance+a?T.Mid:T.Near;if(t===T.Mid){if(e<this.config.nearMaxDistance-a)return T.Near;const n=s?this.config.midMaxDistance:this.config.farMaxDistance;return e>n+a?s?T.Far:T.Terrain:T.Mid}return t===T.Far&&s?e<this.config.midMaxDistance-a?T.Mid:e>this.config.farMaxDistance+a?T.Terrain:T.Far:e>=this.config.farMaxDistance-a?T.Terrain:s?T.Far:T.Mid}resolveNearCoverage(e){const t=this.config.nearMaxDistance-this.config.transitionDistance,s=this.config.nearMaxDistance+this.config.transitionDistance;return 1-x.smoothstep(e,t,s)}resolveFarEntry(e){const t=this.config.midMaxDistance-this.config.transitionDistance,s=this.config.midMaxDistance+this.config.transitionDistance;return x.smoothstep(e,t,s)}resolveFarCoverage(e,t,s){const a=this.config.farMaxDistance-this.config.transitionDistance,n=this.config.farMaxDistance+this.config.transitionDistance,i=x.smoothstep(e,a,n),o=(1-t)*Xs;return x.lerp(o,1,s)*(1-i)}resolveLegacyMidDistanceFade(e){const t=this.config.farMaxDistance-this.config.transitionDistance,s=this.config.farMaxDistance+this.config.transitionDistance;return 1-x.smoothstep(e,t,s)}}function ie(r,e,t){const s=r[e];r[e]=r[t],r[t]=s}function Pe(r,e,t,s,a){a.set(r.subarray(e,e+s)),r.copyWithin(e,t,t+s),r.set(a.subarray(0,s),t)}const Q=new j(...Ns).normalize(),Ys=-Q.x/Math.max(Q.y,.2),js=-Q.z/Math.max(Q.y,.2),Be=.001;class Ks{constructor(){c(this,"disc",new K(0,0,0,1));c(this,"strengthValue",0)}set(e,t,s,a,n,i){if(!Number.isFinite(e)||!Number.isFinite(t)||!Number.isFinite(s)||!Number.isFinite(a)||!Number.isFinite(n)||!Number.isFinite(i)||a<=0||i<=Be){this.clear();return}const o=Math.max(0,n);this.disc.set(e+Ys*o,t,s+js*o,a),this.strengthValue=Math.min(1,i)}clear(){this.strengthValue=0}get strength(){return this.strengthValue}isEnabled(){return this.strengthValue>Be}}const oe=new Ks,V=4,Ie={resolution:256,coverage:24,recoveryRate:.5,freshnessRate:1.4},We=.04,Zs=.3,Qs=1/30,Js=1e-6,Oe=.1,ne=8,et=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,st=`
precision highp float;

#define MAX_CONTACTS ${V}

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
`;class tt{constructor(){c(this,"config",{...Ie});c(this,"inverseCoverage",1/Ie.coverage);c(this,"renderer");c(this,"targets");c(this,"readTarget",0);c(this,"recoveryFloorRatio",We);c(this,"scene",new Cs);c(this,"camera",new ys(-1,1,1,-1,0,1));c(this,"center",new w);c(this,"previousCenter",new w);c(this,"focus",new w);c(this,"contacts",new Float32Array(V*ne));c(this,"contactCount",0);c(this,"accumulatedDeltaSeconds",0);c(this,"material");c(this,"quad");c(this,"hasFocus",!1);c(this,"enabled",!1)}configure(e){const t={...this.config,...e};if(at(t),this.config=t,this.inverseCoverage=1/this.config.coverage,this.renderer){const s=this.renderer;this.releaseTargets(),this.attach(s)}}attach(e){if(this.targets){if(this.renderer===e)return;this.releaseTargets()}this.renderer=e;const t=[];let s;try{const a=this.targetSize(),n=it(e);this.recoveryFloorRatio=n===ss?We:Zs;const i=Ve(a,n);t.push(i);const o=Ve(a,n);t.push(o),this.targets=[i,o],t.length=0,this.material=new Es({vertexShader:et,fragmentShader:st,depthTest:!1,depthWrite:!1,uniforms:{uPrevious:{value:this.targets[0].texture},uCenter:{value:new w},uPreviousCenter:{value:new w},uCoverage:{value:this.config.coverage},uInitialize:{value:0},uDelta:{value:0},uRecoveryRate:{value:this.config.recoveryRate},uRecoveryFloor:{value:this.config.recoveryRate*this.recoveryFloorRatio},uFreshnessRate:{value:this.config.freshnessRate},uContactCount:{value:0},uContacts:{value:Array.from({length:V},()=>new K)},uContactShapes:{value:Array.from({length:V},()=>new K(0,1,0,0))}}}),s=new Rs(2,2),this.quad=new xs(s,this.material),s=void 0,this.quad.frustumCulled=!1,this.scene.add(this.quad),this.enabled=!0,this.primeTargets()}catch(a){try{Y(t)}catch(n){console.warn("[Drusniel World] Pending grass trail target cleanup failed.",n)}if(s)try{s.dispose()}catch(n){console.warn("[Drusniel World] Pending grass trail geometry cleanup failed.",n)}try{this.releaseTargets()}catch(n){console.warn("[Drusniel World] Grass trail attach cleanup failed.",n)}throw this.renderer=void 0,a}}setFocus(e,t){!Number.isFinite(e)||!Number.isFinite(t)||(this.focus.set(e,t),this.hasFocus=!0)}submitContact(e,t,s,a,n,i,o,u){if(!rt(e,t,s,a,n,i,o,u)||a<=0||s<=0||this.contactCount>=V)return;const d=this.contactCount*ne;this.contacts[d]=e,this.contacts[d+1]=t,this.contacts[d+2]=s,this.contacts[d+3]=a,this.contacts[d+4]=n,this.contacts[d+5]=i,this.contacts[d+6]=o,this.contacts[d+7]=u,this.contactCount+=1}render(e){const t=this.renderer,s=this.targets,a=this.material;if(!t||!s||!a||!this.enabled||!this.hasFocus){this.resetPendingFrame();return}if(t.getContext().isContextLost()){this.resetPendingFrame();return}if(!Number.isFinite(e)||e<=0){this.resetPendingFrame();return}if(this.accumulatedDeltaSeconds=Math.min(Oe,this.accumulatedDeltaSeconds+Math.min(e,Oe)),this.accumulatedDeltaSeconds+Js<Qs)return;const n=this.accumulatedDeltaSeconds;this.accumulatedDeltaSeconds=0,this.previousCenter.copy(this.center);const i=this.config.coverage/this.targetSize();this.center.set(Math.round(this.focus.x/i)*i,Math.round(this.focus.y/i)*i);const o=a.uniforms;o.uPrevious.value=s[this.readTarget].texture,o.uCenter.value.copy(this.center),o.uPreviousCenter.value.copy(this.previousCenter),o.uCoverage.value=this.config.coverage,o.uDelta.value=n,o.uRecoveryRate.value=this.config.recoveryRate,o.uRecoveryFloor.value=this.config.recoveryRate*this.recoveryFloorRatio,o.uFreshnessRate.value=this.config.freshnessRate,o.uContactCount.value=this.contactCount;const u=o.uContacts.value,d=o.uContactShapes.value;for(let S=0;S<this.contactCount;S+=1){const v=S*ne;u[S].set(this.contacts[v],this.contacts[v+1],this.contacts[v+2],this.contacts[v+3]),d[S].set(this.contacts[v+4],this.contacts[v+5],x.clamp(this.contacts[v+6],0,.95),x.clamp(this.contacts[v+7],0,1))}this.contactCount=0;const h=1-this.readTarget,f=t.getRenderTarget();try{t.setRenderTarget(s[h]),t.render(this.scene,this.camera),this.readTarget=h}finally{t.setRenderTarget(f)}}isEnabled(){return this.enabled&&this.hasFocus&&this.targets!==void 0}getTexture(){var e;return((e=this.targets)==null?void 0:e[this.readTarget].texture)??null}getCenter(){return this.center}getInverseCoverage(){return this.inverseCoverage}dispose(){this.renderer=void 0,this.enabled=!1,this.hasFocus=!1,this.resetPendingFrame(),this.releaseTargets()}targetSize(){return Math.max(32,Math.round(this.config.resolution))}resetPendingFrame(){this.contactCount=0,this.accumulatedDeltaSeconds=0}releaseTargets(){const e=this.quad,t=this.material,s=this.targets;this.quad=void 0,this.material=void 0,this.targets=void 0,this.readTarget=0,this.enabled=!1,Y([{dispose:()=>e==null?void 0:e.removeFromParent()},e==null?void 0:e.geometry,t,...s??[]])}primeTargets(){const e=this.renderer,t=this.targets,s=this.material;if(!e||!t||!s)return;s.uniforms.uInitialize.value=1,s.uniforms.uContactCount.value=0,s.uniforms.uDelta.value=0;const a=e.getRenderTarget();try{for(const n of t)e.setRenderTarget(n),e.render(this.scene,this.camera)}finally{e.setRenderTarget(a),s.uniforms.uInitialize.value=0}}}function at(r){if(!Number.isInteger(r.resolution)||r.resolution<32)throw new Error("Grass trail resolution must be an integer of at least 32.");for(const[e,t]of[["coverage",r.coverage],["recoveryRate",r.recoveryRate],["freshnessRate",r.freshnessRate]])if(!Number.isFinite(t)||t<=0)throw new Error(`Grass trail ${e} must be a positive finite number.`)}function rt(...r){return r.every(Number.isFinite)}function it(r){const e=r.extensions;return e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float")?ss:ts}function Ve(r,e){const t=new _s(r,r,{format:ws,type:e,minFilter:Z,magFilter:Z,wrapS:ye,wrapT:ye,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1});return t.texture.colorSpace=as,t}const $=new tt,ot=1/48,nt=.06,lt=.085,ut=.55,ct=.037,dt=.31,ht=1.7,mt=.72,gt=.28,ft=.34,St=.073,vt=1.45;function Gt(r){return`mix(${ft.toFixed(2)}, 1.0, 0.5 + 0.5 * sin(${r} * ${St.toFixed(3)}))`}function pt(r){return`fract(dot(floor(${r} * ${vt.toFixed(2)}), vec2(0.1731, 0.4197)))`}function Tt(r){const{target:e,position:t,windDirection:s,time:a,scale:n,speed:i}=r;return`
float ${e} = 0.5 + 0.5 * (
  sin(
    dot(${t}, ${s}) * ${n} -
    ${a} * ${i}
  ) * ${mt.toFixed(2)} +
  sin(
    dot(
      ${t},
      vec2(-${s}.y, ${s}.x)
    ) * ${ct.toFixed(3)} +
    ${a} * ${dt.toFixed(2)} +
    ${ht.toFixed(2)}
  ) * ${gt.toFixed(2)}
);
`}const R=128,le=4,ue=11;function k(r,e,t){let s=Math.imul(r,374761393)^Math.imul(e,668265263)^t;return s=Math.imul(s^s>>>13,1274126177),((s^s>>>16)>>>0)/4294967296}function Ue(r,e,t,s){const a=Math.floor(r),n=Math.floor(e),i=r-a,o=e-n,u=i*i*(3-2*i),d=o*o*(3-2*o),h=(a%t+t)%t,f=(n%t+t)%t,S=(h+1)%t,v=(f+1)%t,C=k(h,f,s),b=k(S,f,s),y=k(h,v,s),g=k(S,v,s),D=C+(b-C)*u,F=y+(g-y)*u;return D+(F-D)*d}function He(r){return Math.max(0,Math.min(255,Math.round(r*255)))}function Dt(r=1597334677){const e=new Uint8Array(R*R*2);for(let s=0;s<R;s+=1)for(let a=0;a<R;a+=1){const n=a/R*le,i=s/R*le,o=Ue(n,i,le,r),u=Ue(a/R*ue,s/R*ue,ue,r^2654435769),d=(o+u*.5)/1.5,h=d*d*(3-2*d),f=(s*R+a)*2;e[f]=He(h),e[f+1]=He(u)}const t=new Ms(e,R,R,As,ts);return t.name="grass-wind-noise",t.wrapS=Ee,t.wrapT=Ee,t.minFilter=Z,t.magFilter=Z,t.generateMipmaps=!1,t.colorSpace=as,t.needsUpdate=!0,t}let U;function Ka(){return U||(U=Dt()),U}function Za(){const r=U;U=void 0,r==null||r.dispose()}const bt=.38,Ct=1,yt=1.38,Et=.9,Rt=.18,xt=.2,_t=.035,wt=.52,Mt=.22,At=.62,Ft=.5,Lt=.9,Nt=1.03,Pt=.5,Bt=0,It=.27,Wt=.56,Ot=.4,Vt=.5,l={tipStart:bt,tipEnd:Ct,tipLuminanceScale:yt,dryLuminanceScale:Et,shadeDrynessPivot:Rt,shadeDrynessScale:xt,shadeDrynessMaximum:_t,instanceDrynessBase:wt,instanceDrynessTip:Mt,drynessMaximum:At,rootFadeEnd:Ft,shadeLightMinimum:Lt,shadeLightMaximum:Nt,shadowDesaturation:Pt,groundContactStart:Bt,groundContactEnd:It,groundContactStrength:Wt,groundContactBaseScale:Ot,groundContactDryScale:Vt},P=new j(.2126,.7152,.0722);function m(r){if(!Number.isFinite(r))throw new TypeError("Grass palette GLSL values must be finite.");return Number.isInteger(r)?`${r}.0`:String(r)}function q(r){return r.r*P.x+r.g*P.y+r.b*P.z}function fe(r,e,t,s,a,n){r.set(s),e.set(a),t.set(n);const i=Math.max(q(r),1e-4);e.multiplyScalar(i*l.tipLuminanceScale/Math.max(q(e),1e-4)),t.multiplyScalar(i*l.dryLuminanceScale/Math.max(q(t),1e-4))}const Ut=.62,Ht=m(Ut),ze=.44,zt=.32,Xe=.15;function B(r,e,t){const s=Math.min(1,Math.max(0,(t-r)/(e-r)));return s*s*(3-2*s)}function ce(r){const e=B(l.tipStart,l.tipEnd,r),t=Math.min(l.drynessMaximum,Xe*(l.instanceDrynessBase+e*l.instanceDrynessTip)),s=(1+(l.tipLuminanceScale-1)*e*zt)*(1-t)+l.dryLuminanceScale*t,a=ze+(1-ze)*B(0,l.rootFadeEnd,r),n=1-B(l.groundContactStart,l.groundContactEnd,r),i=l.groundContactBaseScale+(l.groundContactDryScale-l.groundContactBaseScale)*Xe;return a*(s-l.groundContactStrength*n*(s-i))}const rs=Xt();function Xt(){let e=0;for(let i=0;i<4096;i+=1){const o=(i+.5)/4096;e+=ce(o)*2*(1-o)}e/=4096;const t=1.5*e-.5*ce(1);let s=0,a=1;for(let i=0;i<64;i+=1){const o=(s+a)*.5;ce(o)<t?s=o:a=o}const n=(s+a)*.5;if(!Number.isFinite(n)||n<0||n>=1)throw new RangeError("The grass vertex-palette root progress must resolve inside the blade.");return n}const $t=m(Number(rs.toFixed(5))),kt=1/3,$e=.5,ke=.95,de=new A,qe=new A,he=new A,me=new A,ge=new A,Ye=new A;function je(r,e,t,s,a,n,i,o,u,d){const h=B(l.tipStart,l.tipEnd,a);r.copy(e).lerp(t,h*u);const f=Math.min(Math.max(0,(l.shadeDrynessPivot-n)*l.shadeDrynessScale),l.shadeDrynessMaximum),S=i*(l.instanceDrynessBase+h*l.instanceDrynessTip);r.lerp(s,Math.min(Math.max(0,f+S),l.drynessMaximum));const v=d+(1-d)*B(0,l.rootFadeEnd,a),C=l.shadeLightMinimum+(l.shadeLightMaximum-l.shadeLightMinimum)*n,b=v*C*o;r.multiplyScalar(b);const y=1-B(l.groundContactStart,l.groundContactEnd,a);de.copy(e).multiplyScalar(l.groundContactBaseScale),qe.copy(s).multiplyScalar(l.groundContactDryScale),de.lerp(qe,i).multiplyScalar(b),r.lerp(de,y*l.groundContactStrength);const g=q(r),D=Math.min(Math.max(0,(1-b)*l.shadowDesaturation),1);return r.r+=(g-r.r)*D,r.g+=(g-r.g)*D,r.b+=(g-r.b)*D,r}function Ke(r,e,t,s,a,n,i){je(r,e,t,s,rs,$e,a,ke,i,n),je(Ye,e,t,s,1,$e,a,ke,i,n),r.lerp(Ye,kt)}function Ze(r,e,t,s,a,n,i){fe(he,me,ge,t,s,a),Ke(r,he,me,ge,0,n,i),Ke(e,he,me,ge,1,n,i)}const is=`
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
    ${m(l.tipStart)},
    ${m(l.tipEnd)},
    progress
  );
  vec3 healthyColor = mix(
    baseColor,
    tipColor,
    tipProfile * tipColorStrength
  );
  float shadeDryness = clamp(
    (${m(l.shadeDrynessPivot)} - shade) *
      ${m(l.shadeDrynessScale)},
    0.0,
    ${m(l.shadeDrynessMaximum)}
  );
  float instanceDryness = dryness * (
    ${m(l.instanceDrynessBase)} +
    tipProfile * ${m(l.instanceDrynessTip)}
  );
  vec3 paletteColor = mix(
    healthyColor,
    dryColor,
    clamp(
      shadeDryness + instanceDryness,
      0.0,
      ${m(l.drynessMaximum)}
    )
  );
  float rootLight = mix(
    rootDarkening,
    1.0,
    smoothstep(0.0, ${m(l.rootFadeEnd)}, progress)
  );
  float bladeVariation = mix(
    ${m(l.shadeLightMinimum)},
    ${m(l.shadeLightMaximum)},
    shade
  );
  float occlusion = rootLight * bladeVariation * rootAo;
  vec3 shadedColor = paletteColor * occlusion;
  float groundContact = 1.0 - smoothstep(
    ${m(l.groundContactStart)},
    ${m(l.groundContactEnd)},
    progress
  );
  vec3 groundColor = mix(
    baseColor * ${m(l.groundContactBaseScale)},
    dryColor * ${m(l.groundContactDryScale)},
    dryness
  ) * occlusion;
  shadedColor = mix(
    shadedColor,
    groundColor,
    groundContact * ${m(l.groundContactStrength)}
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
      ${m(P.x)},
      ${m(P.y)},
      ${m(P.z)}
    ))),
    clamp(
      (1.0 - occlusion) * ${m(l.shadowDesaturation)},
      0.0,
      1.0
    )
  );
}
`,qt=1.29,Yt=12,jt=.16,Kt=.55,Qe=.035,Zt=42,Qt=18,Je=.55,Jt=.00107,ea=1.15,sa=3,es=.06,ta=30,aa=64,Qa=Object.freeze({start:28,end:62,floor:.18}),os=`
#define GRASS_MAX_BIOMES ${J}
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
`,ra=`
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
uniform vec2 uGrassMicroFadeRange;
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
`,ia=`
uniform float uGrassPixelWorldScale;
uniform float uGrassMinPixelWidth;
uniform float uGrassBladeHalfWidth;
uniform float uGrassMaxWidenDistance;
`,oa=`
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
`,na=`
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
`,la=`
bool grassKeepLod = uGrassLodInvert < 0.5
  ? grassDither <= uGrassLodThreshold
  : grassDither > uGrassLodThreshold && grassDither <= uGrassDistanceFade;
`,ua=`
uniform float uGrassLodThreshold;
uniform float uGrassDistanceFade;
`,ca=`
vec3 grassWidthAxis = cross(vec3(0.0, 1.0, 0.0), objectNormal);
float grassWidthAxisLength = length(grassWidthAxis);
grassWidthAxis = grassWidthAxisLength > 0.0001
  ? grassWidthAxis / grassWidthAxisLength
  : vec3(1.0, 0.0, 0.0);
float grassSide = uv.x * 2.0 - 1.0;
vec3 grassBladePlaneNormal = normalize(cross(
  grassWidthAxis,
  vec3(0.0, 1.0, 0.0)
));
objectNormal = normalize(mix(objectNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUp));
grassBladePlaneNormal = normalize(
  mix(grassBladePlaneNormal, vec3(0.0, 1.0, 0.0), uGrassNormalUp)
);
`,da=`
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
flat varying float vGrassBiome;
varying float vGrassGust;
`,ha=`
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
// Deliberately NOT derived from this material's own LOD distance. Micro fade
// drives the troughed normal, the per-blade tone variation, and the flutter —
// all shading, none of it LOD. Keying it to uGrassNearDistance gave the five
// near/mid layers five different schedules (3.4 m, 9.4 m, 14.6 m), so the two
// co-located populations inside the ultra-near band were lit differently and
// the handoff at 6-7 m read as a brightness ring following the camera.
float grassMicroFade = 1.0 - smoothstep(
  uGrassMicroFadeRange.x,
  uGrassMicroFadeRange.y,
  grassCameraDistance
);
mat3 grassInstanceBasis = mat3(instanceMatrix);
vec3 grassWidthAxisView = normalize(
  normalMatrix * grassInstanceBasis * grassWidthAxis
);
vec3 grassBladePlaneNormalView = normalize(
  normalMatrix * grassInstanceBasis * grassBladePlaneNormal
);
// Trough curvature is micro detail: progressively remove it without erasing
// the direction of the blade plane itself.
vNormal = normalize(
  vNormal + grassWidthAxisView *
    (grassSide * uGrassBladeCurvature * grassMicroFade)
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
  float grassHorizontalScale = max(length(grassInstanceBasis[0]), 0.0001);
  float grassVerticalScale = max(length(grassInstanceBasis[1]), 0.0001);
  float grassDepthScale = max(length(grassInstanceBasis[2]), 0.0001);
  // A gust front travelling along the wind, tens of metres between crests.
  // Weather and tuft phase keep neighbouring blades in a clump moving together
  // while neighbouring tufts and calm stretches still differ. The envelope only
  // ever scales the bend down, which is what lets the reserved bounds and the
  // configured wind strength keep their existing meaning.
  float grassWeather = ${Gt("uGrassTime")};
  float grassTuftPhase = ${pt("grassWorldRoot.xz")};
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
    grassBladePlaneNormalView = normalize(grassRotateAroundAxis(
      grassBladePlaneNormalView,
      grassWindAxisView,
      grassWindSin,
      grassWindCos
    ));
  }
GRASS_TRAIL_BEND
}

if (grassKeepBlade) {
  // The far end of the micro fade keeps the wind/trail-oriented blade plane.
  // It no longer collapses every blade toward the same world-up normal.
  vNormal = normalize(mix(
    vNormal,
    grassBladePlaneNormalView,
    1.0 - grassMicroFade
  ));
}

`,ma=`
vGrassSheen = vec2(
  (1.0 - smoothstep(
    uGrassSheenFadeDistance * 0.55,
    uGrassSheenFadeDistance,
    grassCameraDistance
  )) * (0.45 + 0.85 * grassGustNoise),
  mix(0.55, 1.0, grassProgress)
);
`,ga=`
vGrassSheen = vec2(0.0, mix(0.55, 1.0, grassProgress));
`,fa=`
vec2 grassGustUv = grassWorldRoot.xz * uGrassWindNoiseScale -
  uGrassWindDirection * (uGrassTime * uGrassWindNoiseSpeed);
float grassGustNoise = texture2D(uGrassWindNoise, grassGustUv).r;
`,Sa=Tt({target:"grassGustNoise",position:"grassWorldRoot.xz",windDirection:"uGrassWindDirection",time:"uGrassTime",scale:"uGrassGustFrontScale",speed:"uGrassGustFrontSpeed"}),va=`
uniform sampler2D uGrassWindNoise;
uniform float uGrassWindNoiseScale;
uniform float uGrassWindNoiseSpeed;
`,Ga=`
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
`,pa=`
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
          grassBladePlaneNormalView = normalize(grassRotateAroundAxis(
            grassBladePlaneNormalView,
            grassTrailAxisView,
            grassTrailSin,
            grassTrailCos
          ));
        }
      }
    }
  }
`,Ta=`
vGrassProgress = grassProgress;
vGrassShade = mix(grassBladeShade, 0.5, (1.0 - grassMicroFade) * 0.86);
vGrassDryness = instanceVariation.w;
vGrassRootAo = instanceVariation.z;
vGrassBiome = instanceBiome;
vGrassGust = grassGustNoise;
`,Da=`
int grassBiomeRow = grassResolveBiomeRow(instanceBiome);
// The palette is resolved at a progress lifted off the root, not at the raw
// attribute. A one-triangle blade only has progress 0 and 1 to offer, so the
// rasteriser draws a chord under a strongly concave curve; evaluating the root
// vertices slightly up the blade makes that chord carry the correct
// area-weighted mean. See GRASS_VERTEX_PALETTE_ROOT_PROGRESS. Only the palette
// argument is remapped: grassProgress itself still drives wind, taper, the gust
// tip lift below, and vGrassProgress for the fragment stage's backlight.
vec3 grassPaletteColor = grassResolvePalette(
  uGrassBiomeBase[grassBiomeRow],
  uGrassBiomeTip[grassBiomeRow],
  uGrassBiomeDry[grassBiomeRow],
  mix(${$t}, 1.0, grassProgress),
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
vec3 grassBiomeCanopy = mix(
  uGrassBiomeCanopyHealthy[grassBiomeRow],
  uGrassBiomeCanopyDry[grassBiomeRow],
  instanceVariation.w
);
vGrassColor = mix(grassPaletteColor, grassBiomeCanopy, 1.0 - grassCoverage);
vGrassProgress = grassProgress;
vGrassDryness = instanceVariation.w;
`,ba=`
${os}
uniform vec3 uGrassBiomeCanopyHealthy[GRASS_MAX_BIOMES];
uniform vec3 uGrassBiomeCanopyDry[GRASS_MAX_BIOMES];
varying vec3 vGrassColor;
varying float vGrassProgress;
varying float vGrassDryness;
${is}
`,Ca=`
${os}
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
${is}
`,ya=`
varying float vGrassGroundShade;
`,Ea=`
diffuseColor.rgb *= vGrassGroundShade;
`,Ra=`
uniform vec3 uGrassTipColor;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
uniform float uGrassSheenStrength;
uniform float uGrassSheenPower;
varying vec3 vGrassColor;
varying vec2 vGrassSheen;
varying float vGrassProgress;
varying float vGrassDryness;
`,xa=`
#include <color_fragment>
diffuseColor.rgb = vGrassColor;
GRASS_GROUND_SHADE_APPLY
reflectedLight.indirectDiffuse += diffuseColor.rgb * uGrassAmbientBoost;
`,_a=`
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
`,wa=`
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
  mix(diffuseColor.rgb, grassLambertLight, ${Ht}) +
  mix(diffuseColor.rgb, uGrassTipColor, 0.35) *
    grassBackLight * uGrassBacklightStrength +
  grassSheen;
`,Ma=`
  // Skip both the half-vector normalization and the high-power lobe once the
  // contribution has faded. This branch is coherent across distant quads.
  if (vGrassSheen.x > 0.001) {
    vec3 grassSunPlusView = grassSunDirection + grassViewDirection;
    vec3 grassHalfVector = length(grassSunPlusView) > 1e-4
      ? normalize(grassSunPlusView)
      : normal;
    grassSheen = directionalLights[0].color * (
      pow(saturate(dot(normal, grassHalfVector)), uGrassSheenPower) *
      uGrassSheenStrength * vGrassSheen.x *
      smoothstep(0.3, 0.92, vGrassProgress)
    );
  }
`,Aa=`
    sin(
      dot(grassWorldRoot.xz, vec2(-grassWindDirection.y, grassWindDirection.x)) /
        (uGrassGustScale * 0.37) +
      uGrassTime * uGrassFlutterSpeed +
      grassMotionPhase * 6.28318530718
    ) * mix(0.72, 1.18, instanceVariation.w)
`;function O(r){return Array.from({length:J},()=>new A(r))}function Fa(r,e){return Array.from({length:J},()=>new w(r,e))}class Ja{constructor(e){c(this,"material");c(this,"colorControls",{baseColor:"#273f22",tipColor:"#83a96b",dryColor:"#a8a06a"});c(this,"uniforms",{uGrassTime:{value:0},uGrassWindDirection:{value:new w(.8,.35).normalize()},uGrassWindStrength:{value:.14},uGrassGustScale:{value:.08},uGrassGustSpeed:{value:.65},uGrassFlutterStrength:{value:.035},uGrassFlutterSpeed:{value:3.4},uGrassBiomeBase:{value:O(this.colorControls.baseColor)},uGrassBiomeTip:{value:O(this.colorControls.tipColor)},uGrassBiomeDry:{value:O(this.colorControls.dryColor)},uGrassBiomeShade:{value:Fa(.55,.5)},uGrassBiomeCanopyHealthy:{value:O(this.colorControls.baseColor)},uGrassBiomeCanopyDry:{value:O(this.colorControls.dryColor)},uGrassTipColor:{value:new A(this.colorControls.tipColor)},uGrassNormalUp:{value:.45},uGrassAmbientBoost:{value:.12},uGrassBacklightStrength:{value:.16},uGrassLodInvert:{value:0},uGrassLodThreshold:{value:1},uGrassDistanceFade:{value:1},uGrassDitherSeed:{value:0},uGrassWindLodScale:{value:1},uGrassMicroFadeRange:{value:new w(3,10)},uGrassNearDistance:{value:0},uGrassMidDistance:{value:0},uGrassTransitionDistance:{value:1},uGrassDetailMode:{value:0},uGrassDetailNearDistance:{value:0},uGrassDetailTransitionDistance:{value:1},uGrassArtDensityScale:{value:1},uGrassBladeCurvature:{value:Kt},uGrassSheenStrength:{value:Qe},uGrassSheenPower:{value:Zt},uGrassSheenFadeDistance:{value:Qt},uGrassGustFrontScale:{value:lt},uGrassGustFrontSpeed:{value:ut},uGrassGustFrontDepth:{value:Je},uGrassGustTipBoost:{value:Le},uGrassWindNoise:{value:null},uGrassWindNoiseScale:{value:ot},uGrassWindNoiseSpeed:{value:nt},uGrassDensityFalloffStart:{value:ta},uGrassDensityFalloffEnd:{value:aa},uGrassDensityFloor:{value:1},uGrassLodDensityScale:{value:1},uGrassPixelWorldScale:{value:Jt},uGrassMinPixelWidth:{value:ea},uGrassBladeHalfWidth:{value:.017},uGrassMaxWidenDistance:{value:es},uGrassTrailMap:{value:null},uGrassTrailCenter:{value:new w},uGrassTrailInverseCoverage:{value:1},uGrassTrailStrength:{value:0},uGrassTrailMaxAngle:{value:qt},uGrassTrailWobbleFrequency:{value:Yt},uGrassTrailWobbleAmplitude:{value:jt},uGrassGroundShadowDisc:{value:new K(0,0,0,1)},uGrassGroundShadowStrength:{value:0}});c(this,"interactive");c(this,"baseWindStrength",.14);c(this,"baseFlutterStrength",.035);c(this,"artRootDarkening",.55);c(this,"artTipColorStrength",.5);this.interactive=e.interactive===!0,this.uniforms.uGrassLodInvert.value=e.invertLodCoverage?1:0,this.uniforms.uGrassWindLodScale.value=e.windLodScale??1,this.uniforms.uGrassDetailMode.value=e.detailMode??0,this.uniforms.uGrassDitherSeed.value=(e.ditherSeed??0)/4294967296,this.setPaletteColors(),this.material=new Fs({side:Ls,color:16777215,transparent:!1,depthWrite:!0}),this.material.name=e.name;const t=e.vertexPalette===!0,s=e.worldLod!==!1,a=e.subPixelWidth===!0,n=e.sheen!==!1,i=e.noiseWind===!0,o=e.microWind!==!1,u=e.instanceFreeDither===!0,d=s?na:la;this.material.onBeforeCompile=h=>{Object.assign(h.uniforms,this.uniforms),h.vertexShader=h.vertexShader.replace("#include <common>",`#include <common>${ra}${this.interactive?oa:""}${s?"":ua}${a?ia:""}${i?va:""}${t?ba:da}`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>${ca}`).replace("#include <begin_vertex>",`#include <begin_vertex>${ha.replace("GRASS_KEEP_LOD",d).replace("GRASS_DITHER_INSTANCE_TERM",u?"":"instanceVariation.x +").replace("GRASS_GUST_NOISE",i?fa:Sa).replace("GRASS_FLUTTER_TERM",o?Aa:"0.0").replace("GRASS_SHEEN_VARYING",n?ma:ga).replace("GRASS_SUBPIXEL_WIDTH",a?Ga:"").replace("GRASS_TRAIL_BEND",this.interactive?pa:"").replace("GRASS_GROUND_SHADE_INIT",this.interactive?"vGrassGroundShade = 1.0;":"")}${t?Da:Ta}`),h.fragmentShader=h.fragmentShader.replace("#include <common>",`#include <common>${t?Ra:Ca}${this.interactive?ya:""}`).replace("#include <color_fragment>",(t?xa:_a).replace("GRASS_GROUND_SHADE_APPLY",this.interactive?Ea:"")).replace("vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",wa.replace("GRASS_SHEEN_OUTPUT",n?Ma:""))},this.material.customProgramCacheKey=()=>e.cacheKey}configure(e,t){this.colorControls.baseColor=e.baseColor,this.colorControls.tipColor=e.tipColor,this.colorControls.dryColor=e.dryColor,this.artRootDarkening=e.rootDarkening,this.setPaletteColors(),this.uniforms.uGrassNormalUp.value=e.normalUp,this.uniforms.uGrassAmbientBoost.value=e.ambientBoost,this.uniforms.uGrassBacklightStrength.value=e.backlightStrength,this.uniforms.uGrassWindDirection.value.set(t.directionX,t.directionZ).normalize(),this.baseWindStrength=t.strength,this.baseFlutterStrength=t.flutterStrength,this.uniforms.uGrassWindStrength.value=t.strength,this.uniforms.uGrassGustScale.value=t.gustScale,this.uniforms.uGrassGustSpeed.value=t.gustSpeed,this.uniforms.uGrassFlutterStrength.value=t.flutterStrength,this.uniforms.uGrassFlutterSpeed.value=t.flutterSpeed}applyArtDirection(e){this.colorControls.baseColor=e.baseColor,this.colorControls.tipColor=e.tipColor,this.colorControls.dryColor=e.dryColor,this.artRootDarkening=e.rootDarkening,this.artTipColorStrength=e.tipColorStrength,this.setPaletteColors(),this.uniforms.uGrassNormalUp.value=e.normalUp,this.uniforms.uGrassAmbientBoost.value=e.ambientBoost,this.uniforms.uGrassBacklightStrength.value=e.backlightStrength,this.uniforms.uGrassArtDensityScale.value=e.densityScale,this.uniforms.uGrassWindStrength.value=this.baseWindStrength*e.windStrengthScale,this.uniforms.uGrassFlutterStrength.value=this.baseFlutterStrength*e.flutterStrengthScale,this.configureGust(e.gustDepth??Je,e.gustTipBoost??Le),this.uniforms.uGrassSheenFadeDistance.value=e.nearDistance}setViewportPixelScale(e){Number.isFinite(e)&&e>0&&(this.uniforms.uGrassPixelWorldScale.value=e)}setBladeHalfWidth(e){const t=Math.max(e,1e-4);this.uniforms.uGrassBladeHalfWidth.value=t,this.uniforms.uGrassMaxWidenDistance.value=Math.min(t*sa,es)}getDitherSeed(){return this.uniforms.uGrassDitherSeed.value}setLodThreshold(e,t=1){this.uniforms.uGrassLodThreshold.value=e,this.uniforms.uGrassDistanceFade.value=t}setMicroDetailFadeRange(e,t){if(!Number.isFinite(e)||!Number.isFinite(t)||e>=t)throw new Error("The grass micro-detail fade range must be a finite increasing interval.");this.uniforms.uGrassMicroFadeRange.value.set(e,t)}configureLod(e){this.uniforms.uGrassNearDistance.value=e.nearMaxDistance,this.uniforms.uGrassMidDistance.value=e.midMaxDistance,this.uniforms.uGrassTransitionDistance.value=e.transitionDistance}configureDetailLod(e){this.uniforms.uGrassDetailNearDistance.value=e.nearMaxDistance,this.uniforms.uGrassDetailTransitionDistance.value=e.transitionDistance}update(e){if(this.uniforms.uGrassTime.value=e,!!this.interactive){if(oe.isEnabled()?(this.uniforms.uGrassGroundShadowDisc.value.copy(oe.disc),this.uniforms.uGrassGroundShadowStrength.value=oe.strength):this.uniforms.uGrassGroundShadowStrength.value=0,!$.isEnabled()){this.uniforms.uGrassTrailStrength.value=0;return}this.uniforms.uGrassTrailMap.value=$.getTexture(),this.uniforms.uGrassTrailCenter.value.copy($.getCenter()),this.uniforms.uGrassTrailInverseCoverage.value=$.getInverseCoverage(),this.uniforms.uGrassTrailStrength.value=1}}configureTrail(e){this.uniforms.uGrassTrailMaxAngle.value=e.maxAngleRadians,this.uniforms.uGrassTrailWobbleFrequency.value=e.wobbleFrequency,this.uniforms.uGrassTrailWobbleAmplitude.value=e.wobbleAmplitude}setPaletteColors(){const e=this.uniforms.uGrassBiomeBase.value,t=this.uniforms.uGrassBiomeTip.value,s=this.uniforms.uGrassBiomeDry.value,a=this.uniforms.uGrassBiomeShade.value,n=this.uniforms.uGrassBiomeCanopyHealthy.value,i=this.uniforms.uGrassBiomeCanopyDry.value;fe(e[0],t[0],s[0],this.colorControls.baseColor,this.colorControls.tipColor,this.colorControls.dryColor),a[0].set(this.artRootDarkening,this.artTipColorStrength),this.uniforms.uGrassTipColor.value.copy(t[0]),Ze(n[0],i[0],this.colorControls.baseColor,this.colorControls.tipColor,this.colorControls.dryColor,this.artRootDarkening,this.artTipColorStrength);for(let o=1;o<J;o+=1){const u=Ps[o];if(!u||u.paletteSource==="art"){e[o].copy(e[0]),t[o].copy(t[0]),s[o].copy(s[0]),a[o].copy(a[0]),n[o].copy(n[0]),i[o].copy(i[0]);continue}fe(e[o],t[o],s[o],u.baseColor,u.tipColor,u.dryColor),a[o].set(u.rootDarkening,u.tipColorStrength),Ze(n[o],i[o],u.baseColor,u.tipColor,u.dryColor,u.rootDarkening,u.tipColorStrength)}}setWindNoise(e,t,s){this.uniforms.uGrassWindNoise.value=e,this.uniforms.uGrassWindNoiseScale.value=t,this.uniforms.uGrassWindNoiseSpeed.value=s}configureDensityFalloff(e,t,s){this.uniforms.uGrassDensityFalloffStart.value=e,this.uniforms.uGrassDensityFalloffEnd.value=t,this.uniforms.uGrassDensityFloor.value=s}getDensityFalloff(){return{start:this.uniforms.uGrassDensityFalloffStart.value,end:this.uniforms.uGrassDensityFalloffEnd.value,floor:this.uniforms.uGrassDensityFloor.value}}setLodDensityScale(e){this.uniforms.uGrassLodDensityScale.value=x.clamp(e,.05,1)}getLodDensityScale(){return this.uniforms.uGrassLodDensityScale.value}configureGust(e,t){this.uniforms.uGrassGustFrontDepth.value=e,this.uniforms.uGrassGustTipBoost.value=t}setSheenEnabled(e){this.uniforms.uGrassSheenStrength.value=e?Qe:0}setupGUI(e,t=[]){const s=[this,...t],a=e.addFolder("Grass Props");a.addColor(this.colorControls,"baseColor").onChange(i=>{for(const o of s)o.colorControls.baseColor=i,o.setPaletteColors()}),a.addColor(this.colorControls,"tipColor").onChange(i=>{for(const o of s)o.colorControls.tipColor=i,o.setPaletteColors()}),a.addColor(this.colorControls,"dryColor").onChange(i=>{for(const o of s)o.colorControls.dryColor=i,o.setPaletteColors()});const n={value:this.artTipColorStrength};a.add(n,"value",.15,.75,.01).name("Tip Mix").onChange(i=>{for(const o of s)o.artTipColorStrength=i,o.setPaletteColors()}),a.add(this.uniforms.uGrassWindStrength,"value",0,.45,.005).name("Wind Strength").onChange(i=>{for(const o of t)o.uniforms.uGrassWindStrength.value=i}),a.add(this.uniforms.uGrassFlutterStrength,"value",0,.15,.0025).name("Tip Flutter").onChange(i=>{for(const o of t)o.uniforms.uGrassFlutterStrength.value=i}),a.add(this.uniforms.uGrassNormalUp,"value",0,.9,.01).name("Normal Up").onChange(i=>{for(const o of t)o.uniforms.uGrassNormalUp.value=i}),a.add(this.uniforms.uGrassAmbientBoost,"value",0,.4,.01).name("Ambient Boost").onChange(i=>{for(const o of t)o.uniforms.uGrassAmbientBoost.value=i}),a.add(this.uniforms.uGrassBacklightStrength,"value",0,.5,.01).name("Backlight").onChange(i=>{for(const o of t)o.uniforms.uGrassBacklightStrength.value=i}),a.add(this.uniforms.uGrassBladeCurvature,"value",0,1.2,.01).name("Blade Curve").onChange(i=>{for(const o of t)o.uniforms.uGrassBladeCurvature.value=i}),a.add(this.uniforms.uGrassSheenStrength,"value",0,.3,.005).name("Sheen").onChange(i=>{for(const o of t)o.uniforms.uGrassSheenStrength.value=i}),a.add(this.uniforms.uGrassSheenPower,"value",8,96,1).name("Sheen Focus").onChange(i=>{for(const o of t)o.uniforms.uGrassSheenPower.value=i}),a.add(this.uniforms.uGrassGustFrontDepth,"value",0,.9,.01).name("Gust Fronts").onChange(i=>{for(const o of t)o.uniforms.uGrassGustFrontDepth.value=i}),a.add(this.uniforms.uGrassGustFrontSpeed,"value",0,1.6,.01).name("Gust Speed").onChange(i=>{for(const o of t)o.uniforms.uGrassGustFrontSpeed.value=i}),a.open()}}const La=.1;class er{constructor(){c(this,"elapsedSeconds",0)}update(e){return!Number.isFinite(e)||e<=0?this.elapsedSeconds:(this.elapsedSeconds+=Math.min(e,La),this.elapsedSeconds)}}function sr(){const r=Math.max(1,window.innerWidth),e=Math.max(1,window.innerHeight);return{width:r,height:e,aspect:r/e}}function tr(r){const e=window.devicePixelRatio,t=Number.isFinite(e)&&e>0?e:1;return Math.min(t,r)}export{ut as A,lt as B,Ka as C,Qa as D,Za as E,Va as G,Us as S,er as W,Ua as a,Ja as b,Ya as c,ja as d,T as e,tr as f,oe as g,$ as h,Re as i,Bs as j,za as k,ka as l,qa as m,Xa as n,Ha as o,Le as p,nt as q,sr as r,fe as s,ot as t,Xs as u,is as v,Ht as w,Tt as x,Gt as y,$a as z};
