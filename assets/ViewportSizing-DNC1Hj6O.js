var je=Object.defineProperty;var Ye=(r,e,t)=>e in r?je(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var l=(r,e,t)=>Ye(r,typeof e!="symbol"?e+"":e,t);import{F as Ke,b as Ze,P as v,c as Qe,a as M,N as y,U as Je}from"./index-DLQ8WaTH.js";import{ab as es,aa as Z,v as ss,z as B,b as C,V as z,d as ts,aw as as,a4 as $,W as rs,k as is,ax as os,a as A,ay as We,a9 as ns,n as ls,az as us,a2 as Oe,aA as cs,a6 as fe,$ as k,a1 as ds,Y as Ue,a0 as hs,aB as ms,Z as ve,j as oe,U as gs,K as fs}from"./WorldEnvironmentTuning-CiYhxW2A.js";import{G as q,a as vs}from"./GrassBiomeProfile-Do85lwdi.js";const Ss=2,Se=2048,Ge=4,Gs=/^#[0-9a-fA-F]{6}$/,pe=1e5,De=64,be=5e6;function ps(r){if(r.instanceCount>pe)throw new Error(`instanceCount must not exceed ${pe}.`);if(r.geometry.variantCount>De)throw new Error(`variantCount must not exceed ${De}.`);if(r.geometry.variantCount>r.instanceCount)throw new Error("variantCount must not exceed instanceCount.");if(r.instanceCount*r.geometry.bladesPerClump*r.geometry.bladeSegments>be)throw new Error(`Configured near-grass workload must not exceed ${be}.`);if(r.geometry.bladesPerClump<3)throw new Error("bladesPerClump must be at least 3.");if(r.geometry.bladeSegments<2)throw new Error("bladeSegments must be at least 2.");if(r.geometry.midBladesPerClump<2)throw new Error("midBladesPerClump must be at least 2.");if(r.geometry.midBladeSegments<1)throw new Error("midBladeSegments must be at least 1.");if(r.geometry.midBladesPerClump>r.geometry.bladesPerClump)throw new Error("midBladesPerClump must not exceed bladesPerClump.");if(r.geometry.midBladeSegments>=r.geometry.bladeSegments)throw new Error("midBladeSegments must be lower than bladeSegments.");if(r.geometry.bladeHeightMin>r.geometry.bladeHeightMax)throw new Error("bladeHeightMin must be less than or equal to bladeHeightMax.");if(r.geometry.bladeWidthMin>r.geometry.bladeWidthMax)throw new Error("bladeWidthMin must be less than or equal to bladeWidthMax.");if(r.geometry.bladeLeanMin>r.geometry.bladeLeanMax)throw new Error("bladeLeanMin must be less than or equal to bladeLeanMax.");if(r.distribution.densityMin>r.distribution.densityMax)throw new Error("densityMin must be less than or equal to densityMax.");if(r.lod.nearMaxDistance>=r.lod.midMaxDistance||r.lod.midMaxDistance>=r.lod.farMaxDistance)throw new Error("Grass LOD distances must increase from near to far.");if(r.lod.transitionDistance>=r.lod.nearMaxDistance)throw new Error("transitionDistance must be lower than nearMaxDistance.");if(r.lod.hysteresisDistance>=r.lod.nearMaxDistance-r.lod.transitionDistance)throw new Error("hysteresisDistance is too large for the near LOD band.");if(Math.hypot(r.wind.directionX,r.wind.directionZ)<Number.EPSILON)throw new Error("Grass wind direction must not be zero.");for(const[t,s]of[["baseColor",r.material.baseColor],["tipColor",r.material.tipColor],["dryColor",r.material.dryColor]])if(!Gs.test(s))throw new Error(`Grass config value ${t} must be a six-digit hex color.`);if(r.impostor.viewsPerAxis<2)throw new Error("impostorViewsPerAxis must be at least 2.");if(r.impostor.viewsPerAxis>16)throw new Error("impostorViewsPerAxis must not exceed 16.");if(r.impostor.frameResolution<32)throw new Error("impostorFrameResolution must be at least 32.");if(r.impostor.padding<Ge)throw new Error(`impostorPadding must be at least ${Ge} pixels for mip-safe atlas isolation.`);if((r.impostor.frameResolution+r.impostor.padding*2)*r.impostor.viewsPerAxis*Ss>Se)throw new Error(`Impostor atlas size must not exceed ${Se} pixels.`);if(r.impostor.cameraMargin<1)throw new Error("impostorCameraMargin must be at least 1.")}const Ds="./config/grass.yaml";function bs(){return`${Ds}?v=${encodeURIComponent("v0.9.6+178e38e7930c")}`}class fa{async load(e=bs()){const t=await fetch(e);if(!t.ok)throw new Error(`Unable to load grass config from ${e}: HTTP ${t.status}`);return this.parse(await t.text())}parse(e){const t=Ke.parse(e,"grass"),s=new Ze(t,"Grass"),a={instanceCount:s.number("instanceCount",M),patchSize:s.number("patchSize",v),geometry:{variantCount:s.number("variantCount",M),bladesPerClump:s.number("bladesPerClump",M),bladeSegments:s.number("bladeSegments",M),clumpRadius:s.number("clumpRadius",v),bladeHeightMin:s.number("bladeHeightMin",v),bladeHeightMax:s.number("bladeHeightMax",v),bladeWidthMin:s.number("bladeWidthMin",v),bladeWidthMax:s.number("bladeWidthMax",v),bladeLeanMin:s.number("bladeLeanMin",y),bladeLeanMax:s.number("bladeLeanMax",y),bladeCurve:s.number("bladeCurve",{minimum:0,maximum:1.2}),midBladesPerClump:s.number("midBladesPerClump",M),midBladeSegments:s.number("midBladeSegments",M),midRadiusScale:s.number("midRadiusScale",v),midHeightScale:s.number("midHeightScale",v),midWidthScale:s.number("midWidthScale",v),midLeanScale:s.number("midLeanScale",y)},distribution:{seed:s.number("seed",Je),rootSink:s.number("rootSink",y),maxSlopeDegrees:s.number("maxSlopeDegrees",{minimum:0,maximum:89}),heightVariation:s.number("heightVariation",{minimum:0,maximum:.95}),widthVariation:s.number("widthVariation",{minimum:0,maximum:.95}),densityMin:s.number("densityMin",{minimum:0,maximum:1}),densityMax:s.number("densityMax",{minimum:0,maximum:1}),densityScale:s.number("densityScale",v)},wind:{directionX:s.number("windDirectionX"),directionZ:s.number("windDirectionZ"),strength:s.number("windStrength",y),gustScale:s.number("gustScale",v),gustSpeed:s.number("gustSpeed",y),flutterStrength:s.number("flutterStrength",y),flutterSpeed:s.number("flutterSpeed",y)},material:{baseColor:s.string("baseColor"),tipColor:s.string("tipColor"),dryColor:s.string("dryColor"),rootDarkening:s.number("rootDarkening",{minimum:0,maximum:1}),normalUp:s.number("normalUp",{minimum:0,maximum:1}),ambientBoost:s.number("ambientBoost",{minimum:0,maximum:1}),backlightStrength:s.number("backlightStrength",{minimum:0,maximum:1})},lod:{nearMaxDistance:s.number("nearMaxDistance",v),midMaxDistance:s.number("midMaxDistance",v),farMaxDistance:s.number("farMaxDistance",v),hysteresisDistance:s.number("hysteresisDistance",y),transitionDistance:s.number("transitionDistance",v)},qa:{warmupSeconds:s.number("qaWarmupSeconds",y),sampleSeconds:s.number("qaSampleSeconds",v)},impostor:{viewsPerAxis:s.number("impostorViewsPerAxis",M),frameResolution:s.number("impostorFrameResolution",M),padding:s.number("impostorPadding",Qe),cameraMargin:s.number("impostorCameraMargin",v)}};return t.assertFullyConsumed(),ps(a),Object.freeze({...a,geometry:Object.freeze(a.geometry),distribution:Object.freeze(a.distribution),wind:Object.freeze(a.wind),material:Object.freeze(a.material),lod:Object.freeze(a.lod),qa:Object.freeze(a.qa),impostor:Object.freeze(a.impostor)})}}class Ts{constructor(e){l(this,"state");this.state=e>>>0}next(){this.state=this.state+1831565813>>>0;let e=this.state;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}range(e,t){return e+(t-e)*this.next()}}const Cs=Math.PI*2,Te=2654435769,ys=1e-4;function Ce(r,e,t){const s=C.clamp(t,0,1);if(!(e>ys))return{y:r*s,z:0};const a=s*s,n=e*a,i=r/e;return{y:i*Math.sin(n),z:i*(1-Math.cos(n))}}class va{createLodVariants(e,t){const s={bladesPerClump:e.midBladesPerClump,bladeSegments:e.midBladeSegments,clumpRadius:e.clumpRadius*e.midRadiusScale,bladeHeightMin:e.bladeHeightMin*e.midHeightScale,bladeHeightMax:e.bladeHeightMax*e.midHeightScale,bladeWidthMin:e.bladeWidthMin*e.midWidthScale,bladeWidthMax:e.bladeWidthMax*e.midWidthScale,bladeLeanMin:e.bladeLeanMin*e.midLeanScale,bladeLeanMax:e.bladeLeanMax*e.midLeanScale,bladeCurve:e.bladeCurve};return{near:this.createVariants(e,e.variantCount,t),mid:this.createVariants(s,e.variantCount,t^Te)}}createInstancedGeometry(e,t,s,a,n){var u,c;const i=new es;e.index&&i.setIndex(e.index);for(const[D,g]of Object.entries(e.attributes))i.setAttribute(D,g);i.setAttribute("instanceVariation",(a==null?void 0:a.variation)??new Z(t,4));const o=t.length/4,d=s??new Float32Array(o).fill(1);return i.setAttribute("instanceCoverage",(a==null?void 0:a.coverage)??new Z(d,1)),i.setAttribute("instanceBiome",(a==null?void 0:a.biome)??new Z(n??new Float32Array(o),1)),i.boundingBox=((u=e.boundingBox)==null?void 0:u.clone())??null,i.boundingSphere=((c=e.boundingSphere)==null?void 0:c.clone())??null,i}disposeInstancedMesh(e,t=!1){const s=e.geometry;for(const a of Object.keys(s.attributes))(t||a!=="instanceVariation"&&a!=="instanceCoverage"&&a!=="instanceBiome")&&s.deleteAttribute(a);s.setIndex(null),s.dispose(),t||e.dispose()}createVariants(e,t,s){return Array.from({length:t},(a,n)=>this.createClump(e,s+n*Te))}createClump(e,t){const s=new Ts(t),a=[],n=[],i=[],o=[],d=[],u=[];for(let D=0;D<e.bladesPerClump;D+=1){const g=s.range(0,Cs),f=Math.sqrt(s.next())*e.clumpRadius,x=Math.cos(g)*f,_=Math.sin(g)*f,E=g+s.range(-.85,.85),S=Math.cos(E)*.5,R=Math.sin(E)*.5,w=-Math.sin(E),b=Math.cos(E),F=g+s.range(-.65,.65),I=s.range(e.bladeLeanMin,e.bladeLeanMax),ne=Math.cos(F)*I,le=Math.sin(F)*I,ue=s.range(e.bladeHeightMin,e.bladeHeightMax),ze=s.range(e.bladeWidthMin,e.bladeWidthMax),j=s.next(),Y=s.next(),ce=a.length/3;for(let L=0;L<e.bladeSegments;L+=1){const G=L/e.bladeSegments,he=G*G*(3-2*G),qe=Math.pow(1-G,.72),O=ze*qe,U=Ce(ue,e.bladeCurve,G),me=x+ne*he+w*U.z,ge=_+le*he+b*U.z;a.push(me-S*O,U.y,ge-R*O,me+S*O,U.y,ge+R*O),n.push(0,G,1,G),i.push(G,G),o.push(j,j),d.push(Y,Y)}const K=Ce(ue,e.bladeCurve,1),$e=x+ne+w*K.z,ke=_+le+b*K.z,Xe=a.length/3;a.push($e,K.y,ke),n.push(.5,1),i.push(1),o.push(j),d.push(Y);for(let L=0;L<e.bladeSegments-1;L+=1){const G=ce+L*2;u.push(G,G+2,G+1,G+2,G+3,G+1)}const de=ce+(e.bladeSegments-1)*2;u.push(de,Xe,de+1)}const c=new ss;return c.setAttribute("position",new B(a,3)),c.setAttribute("uv",new B(n,2)),c.setAttribute("grassProgress",new B(i,1)),c.setAttribute("grassPhase",new B(o,1)),c.setAttribute("grassBladeShade",new B(d,1)),c.setIndex(u),c.computeVertexNormals(),c.computeBoundingBox(),c.computeBoundingSphere(),c}}const xs=0,Sa=1.12,Ga=1.1,pa=1.2,Da=.35,ye=.07,ba=.08,Ta=.15;var p=(r=>(r[r.Near=0]="Near",r[r.Mid=1]="Mid",r[r.Far=2]="Far",r[r.Terrain=3]="Terrain",r))(p||{});class Ca{constructor(e){l(this,"patches",new Map);this.patchSize=e}keyFor(e){return this.key(Math.floor(e.x/this.patchSize),Math.floor(e.z/this.patchSize))}coordinatesFor(e){return[Math.floor(e.x/this.patchSize),Math.floor(e.z/this.patchSize)]}register(e){if(this.patches.has(e.id))throw new Error(`Grass patch ${e.id} is already registered.`);this.patches.set(e.id,e)}values(){return this.patches.values()}clear(){this.patches.clear()}key(e,t){return`${e}:${t}`}}const Q=.001,Es=1/1024,xe=3,Rs=4;function _s(r,e){let t=0,s=r.length;for(;t<s;){const a=t+s>>>1;r[a]>e?t=a+1:s=a}return t}class ya{constructor(e){l(this,"cameraPosition",new z);l(this,"closestPoint",new z);l(this,"projectionViewMatrix",new ts);l(this,"frustum",new as);l(this,"midFalloff",{start:0,end:1,floor:1,scale:1});l(this,"submittedMidVertices",0);l(this,"submittedFarInstances",0);l(this,"midInstanceRadius",Rs);l(this,"compactFarthest",0);l(this,"matrixSwap",new Float32Array(16));l(this,"variationSwap",new Float32Array(4));this.config=e}setMidDensityFalloff(e){this.midFalloff=e}setMidInstanceRadius(e){Number.isFinite(e)&&e>0&&(this.midInstanceRadius=e)}update(e,t){e.updateMatrixWorld(),e.getWorldPosition(this.cameraPosition),this.projectionViewMatrix.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projectionViewMatrix),this.submittedMidVertices=0;const s=this.config.farMaxDistance+this.config.transitionDistance;for(const a of t){if(a.bounds.clampPoint(this.cameraPosition,this.closestPoint),a.distance=this.cameraPosition.distanceTo(this.closestPoint),a.distance>=s){a.inFrustum=!1,a.nearMesh&&(a.nearMesh.visible=!1),a.midMesh.visible=!1,a.farMesh&&(a.farMesh.visible=!1);continue}a.inFrustum=this.frustum.intersectsBox(a.bounds),a.farMesh||a.hasFarImpostor?this.updateThreeStagePatch(a):this.updateLegacyPatch(a)}}updateFarGroups(e){const t=this.config.farMaxDistance+this.config.transitionDistance,s=this.config.midMaxDistance-this.config.transitionDistance;this.submittedFarInstances=0;for(const a of e){if(a.bounds.clampPoint(this.cameraPosition,this.closestPoint),a.distance=this.cameraPosition.distanceTo(this.closestPoint),a.distance>=t){a.inFrustum=!1,a.mesh.visible=!1;continue}if(a.inFrustum=this.frustum.intersectsBox(a.bounds),!a.inFrustum){a.mesh.visible=!1;continue}const n=this.cameraPosition.distanceTo(a.boundingSphere.center)+a.boundingSphere.radius;a.mesh.visible=n>s,a.mesh.visible&&(this.submittedFarInstances+=a.mesh.count)}}getSubmittedMidVertices(){return this.submittedMidVertices}getSubmittedFarInstances(){return this.submittedFarInstances}updateThreeStagePatch(e){e.lod=this.resolveLevel(e.distance,e.lod,!0),e.nearCoverage=this.resolveNearCoverage(e.distance);const t=this.resolveFarEntry(e.distance);if(e.midCoverage=Math.max(0,(1-e.nearCoverage)*(1-t)),e.farCoverage=this.resolveFarCoverage(e.distance,e.nearCoverage,t),!e.inFrustum){e.nearMesh&&(e.nearMesh.visible=!1),e.midMesh.visible=!1,e.farMesh&&(e.farMesh.visible=!1);return}const s=this.cameraPosition.distanceTo(e.boundingSphere.center)+e.boundingSphere.radius,a=this.config.nearMaxDistance-this.config.transitionDistance,n=this.config.nearMaxDistance+this.config.transitionDistance,i=this.config.midMaxDistance-this.config.transitionDistance,o=this.config.midMaxDistance+this.config.transitionDistance,d=this.config.farMaxDistance+this.config.transitionDistance;e.nearMesh&&(e.nearMesh.visible=e.distance<n),e.midMesh.visible=s>a&&e.distance<o,e.midMesh.visible&&(this.compactMidInstances(e,a,s)===0?e.midMesh.visible=!1:this.trimMidDraw(e,Math.min(s,this.compactFarthest))),e.farMesh&&(e.farMesh.visible=s>i&&e.distance<d)}trimMidDraw(e,t){const s=e.midSortedDithers;if(!s)return;const a=this.resolveNearCoverage(t),n=this.resolveFarEntry(e.distance),i=Math.max(a,n),d=1-this.midFalloff.scale*C.lerp(1,this.midFalloff.floor,C.smoothstep(e.distance,this.midFalloff.start,this.midFalloff.end))*(1-i)-Es,u=d<=0?s.length:_s(s,d);e.midMesh.geometry.setDrawRange(0,u*xe),this.submittedMidVertices+=u*xe*e.midMesh.count}compactMidInstances(e,t,s){const a=e.midMesh,n=e.instanceCount;if(n<=0)return a.count=0,this.compactFarthest=0,0;if(e.distance>t)return a.count=n,this.compactFarthest=s,n;const i=a.instanceMatrix.array,o=a.geometry.getAttribute("instanceVariation"),d=a.geometry.getAttribute("instanceCoverage"),u=a.geometry.getAttribute("instanceBiome");if(!o||!d||!u)return a.count=n,this.compactFarthest=s,n;const c=o.array,D=d.array,g=u.array,f=e.baseMidCoverage,x=a.position,_=this.cameraPosition,E=this.midInstanceRadius;let S=0,R=0,w=!1;for(let b=0;b<n;b+=1){const F=b*16,I=Math.hypot(x.x+i[F+12]-_.x,x.y+i[F+13]-_.y,x.z+i[F+14]-_.z);I+E<=t||(R=Math.max(R,I),S!==b&&(w=!0,Ee(i,S*16,F,16,this.matrixSwap),Ee(c,S*4,b*4,4,this.variationSwap),J(D,S,b),J(g,S,b),f&&J(f,S,b)),S+=1)}return S!==a.count&&(a.count=S),w&&(a.instanceMatrix.needsUpdate=!0,o.needsUpdate=!0,d.needsUpdate=!0,u.needsUpdate=!0),this.compactFarthest=S===0?0:R,S}updateLegacyPatch(e){const t=e.nearMesh;if(t){if(e.lod=this.resolveLevel(e.distance,e.lod,!1),e.nearCoverage=this.resolveNearCoverage(e.distance),e.midDistanceFade=this.resolveLegacyMidDistanceFade(e.distance),!e.inFrustum){t.visible=!1,e.midMesh.visible=!1;return}t.visible=e.nearCoverage>Q,e.midMesh.visible=e.nearCoverage<1-Q&&e.midDistanceFade>Q}}resolveLevel(e,t,s){const a=this.config.hysteresisDistance;if(t===p.Near)return e>this.config.nearMaxDistance+a?p.Mid:p.Near;if(t===p.Mid){if(e<this.config.nearMaxDistance-a)return p.Near;const n=s?this.config.midMaxDistance:this.config.farMaxDistance;return e>n+a?s?p.Far:p.Terrain:p.Mid}return t===p.Far&&s?e<this.config.midMaxDistance-a?p.Mid:e>this.config.farMaxDistance+a?p.Terrain:p.Far:e>=this.config.farMaxDistance-a?p.Terrain:s?p.Far:p.Mid}resolveNearCoverage(e){const t=this.config.nearMaxDistance-this.config.transitionDistance,s=this.config.nearMaxDistance+this.config.transitionDistance;return 1-C.smoothstep(e,t,s)}resolveFarEntry(e){const t=this.config.midMaxDistance-this.config.transitionDistance,s=this.config.midMaxDistance+this.config.transitionDistance;return C.smoothstep(e,t,s)}resolveFarCoverage(e,t,s){const a=this.config.farMaxDistance-this.config.transitionDistance,n=this.config.farMaxDistance+this.config.transitionDistance,i=C.smoothstep(e,a,n),o=(1-t)*xs;return C.lerp(o,1,s)*(1-i)}resolveLegacyMidDistanceFade(e){const t=this.config.farMaxDistance-this.config.transitionDistance,s=this.config.farMaxDistance+this.config.transitionDistance;return 1-C.smoothstep(e,t,s)}}function J(r,e,t){const s=r[e];r[e]=r[t],r[t]=s}function Ee(r,e,t,s,a){a.set(r.subarray(e,e+s)),r.copyWithin(e,t,t+s),r.set(a.subarray(0,s),t)}const X=new z(...rs).normalize(),Ms=-X.x/Math.max(X.y,.2),As=-X.z/Math.max(X.y,.2),Re=.001;class ws{constructor(){l(this,"disc",new $(0,0,0,1));l(this,"strengthValue",0)}set(e,t,s,a,n,i){if(!Number.isFinite(e)||!Number.isFinite(t)||!Number.isFinite(s)||!Number.isFinite(a)||!Number.isFinite(n)||!Number.isFinite(i)||a<=0||i<=Re){this.clear();return}const o=Math.max(0,n);this.disc.set(e+Ms*o,t,s+As*o,a),this.strengthValue=Math.min(1,i)}clear(){this.strengthValue=0}get strength(){return this.strengthValue}isEnabled(){return this.strengthValue>Re}}const ee=new ws,W=4,_e={resolution:256,coverage:24,recoveryRate:.5,freshnessRate:1.4},Me=.04,Fs=.3,Ls=1/30,Ns=1e-6,Ae=.1,se=8,Ps=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,Is=`
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
`;class Bs{constructor(){l(this,"config",{..._e});l(this,"inverseCoverage",1/_e.coverage);l(this,"renderer");l(this,"targets");l(this,"readTarget",0);l(this,"recoveryFloorRatio",Me);l(this,"scene",new is);l(this,"camera",new os(-1,1,1,-1,0,1));l(this,"center",new A);l(this,"previousCenter",new A);l(this,"focus",new A);l(this,"contacts",new Float32Array(W*se));l(this,"contactCount",0);l(this,"accumulatedDeltaSeconds",0);l(this,"material");l(this,"quad");l(this,"hasFocus",!1);l(this,"enabled",!1)}configure(e){const t={...this.config,...e};if(Ws(t),this.config=t,this.inverseCoverage=1/this.config.coverage,this.renderer){const s=this.renderer;this.releaseTargets(),this.attach(s)}}attach(e){if(this.targets){if(this.renderer===e)return;this.releaseTargets()}this.renderer=e;const t=[];try{const s=this.targetSize(),a=Us(e);this.recoveryFloorRatio=a===We?Me:Fs;const n=we(s,a);t.push(n);const i=we(s,a);t.push(i),this.targets=[n,i],t.length=0,this.material=new ns({vertexShader:Ps,fragmentShader:Is,depthTest:!1,depthWrite:!1,uniforms:{uPrevious:{value:this.targets[0].texture},uCenter:{value:new A},uPreviousCenter:{value:new A},uCoverage:{value:this.config.coverage},uInitialize:{value:0},uDelta:{value:0},uRecoveryRate:{value:this.config.recoveryRate},uRecoveryFloor:{value:this.config.recoveryRate*this.recoveryFloorRatio},uFreshnessRate:{value:this.config.freshnessRate},uContactCount:{value:0},uContacts:{value:Array.from({length:W},()=>new $)},uContactShapes:{value:Array.from({length:W},()=>new $(0,1,0,0))}}}),this.quad=new ls(new us(2,2),this.material),this.quad.frustumCulled=!1,this.scene.add(this.quad),this.enabled=!0,this.primeTargets()}catch(s){for(const a of t)a.dispose();throw this.releaseTargets(),this.renderer=void 0,s}}setFocus(e,t){!Number.isFinite(e)||!Number.isFinite(t)||(this.focus.set(e,t),this.hasFocus=!0)}submitContact(e,t,s,a,n,i,o,d){if(!Os(e,t,s,a,n,i,o,d)||a<=0||s<=0||this.contactCount>=W)return;const u=this.contactCount*se;this.contacts[u]=e,this.contacts[u+1]=t,this.contacts[u+2]=s,this.contacts[u+3]=a,this.contacts[u+4]=n,this.contacts[u+5]=i,this.contacts[u+6]=o,this.contacts[u+7]=d,this.contactCount+=1}render(e){const t=this.renderer,s=this.targets,a=this.material;if(!t||!s||!a||!this.enabled||!this.hasFocus){this.resetPendingFrame();return}if(!Number.isFinite(e)||e<=0){this.resetPendingFrame();return}if(this.accumulatedDeltaSeconds=Math.min(Ae,this.accumulatedDeltaSeconds+Math.min(e,Ae)),this.accumulatedDeltaSeconds+Ns<Ls){this.contactCount=0;return}const n=this.accumulatedDeltaSeconds;this.accumulatedDeltaSeconds=0,this.previousCenter.copy(this.center);const i=this.config.coverage/this.targetSize();this.center.set(Math.round(this.focus.x/i)*i,Math.round(this.focus.y/i)*i);const o=a.uniforms;o.uPrevious.value=s[this.readTarget].texture,o.uCenter.value.copy(this.center),o.uPreviousCenter.value.copy(this.previousCenter),o.uCoverage.value=this.config.coverage,o.uDelta.value=n,o.uRecoveryRate.value=this.config.recoveryRate,o.uRecoveryFloor.value=this.config.recoveryRate*this.recoveryFloorRatio,o.uFreshnessRate.value=this.config.freshnessRate,o.uContactCount.value=this.contactCount;const d=o.uContacts.value,u=o.uContactShapes.value;for(let g=0;g<this.contactCount;g+=1){const f=g*se;d[g].set(this.contacts[f],this.contacts[f+1],this.contacts[f+2],this.contacts[f+3]),u[g].set(this.contacts[f+4],this.contacts[f+5],C.clamp(this.contacts[f+6],0,.95),C.clamp(this.contacts[f+7],0,1))}this.contactCount=0;const c=1-this.readTarget,D=t.getRenderTarget();try{t.setRenderTarget(s[c]),t.render(this.scene,this.camera),this.readTarget=c}finally{t.setRenderTarget(D)}}isEnabled(){return this.enabled&&this.hasFocus&&this.targets!==void 0}getTexture(){var e;return((e=this.targets)==null?void 0:e[this.readTarget].texture)??null}getCenter(){return this.center}getInverseCoverage(){return this.inverseCoverage}dispose(){this.releaseTargets(),this.renderer=void 0,this.enabled=!1,this.hasFocus=!1,this.resetPendingFrame()}targetSize(){return Math.max(32,Math.round(this.config.resolution))}resetPendingFrame(){this.contactCount=0,this.accumulatedDeltaSeconds=0}releaseTargets(){var e;this.quad&&(this.scene.remove(this.quad),this.quad.geometry.dispose(),this.quad=void 0),(e=this.material)==null||e.dispose(),this.material=void 0;for(const t of this.targets??[])t.dispose();this.targets=void 0,this.readTarget=0,this.enabled=!1}primeTargets(){const e=this.renderer,t=this.targets,s=this.material;if(!e||!t||!s)return;s.uniforms.uInitialize.value=1,s.uniforms.uContactCount.value=0,s.uniforms.uDelta.value=0;const a=e.getRenderTarget();try{for(const n of t)e.setRenderTarget(n),e.render(this.scene,this.camera)}finally{e.setRenderTarget(a),s.uniforms.uInitialize.value=0}}}function Ws(r){if(!Number.isInteger(r.resolution)||r.resolution<32)throw new Error("Grass trail resolution must be an integer of at least 32.");for(const[e,t]of[["coverage",r.coverage],["recoveryRate",r.recoveryRate],["freshnessRate",r.freshnessRate]])if(!Number.isFinite(t)||t<=0)throw new Error(`Grass trail ${e} must be a positive finite number.`)}function Os(...r){return r.every(Number.isFinite)}function Us(r){const e=r.extensions;return e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float")?We:Oe}function we(r,e){const t=new cs(r,r,{format:ds,type:e,minFilter:k,magFilter:k,wrapS:fe,wrapT:fe,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1});return t.texture.colorSpace=Ue,t}const V=new Bs,Vs=1/48,Hs=.06,zs=.085,$s=.55,ks=.037,Xs=.31,qs=1.7,js=.72,Ys=.28,Ks=.34,Zs=.073,Qs=1.45;function Js(r){return`mix(${Ks.toFixed(2)}, 1.0, 0.5 + 0.5 * sin(${r} * ${Zs.toFixed(3)}))`}function et(r){return`fract(dot(floor(${r} * ${Qs.toFixed(2)}), vec2(0.1731, 0.4197)))`}function st(r){const{target:e,position:t,windDirection:s,time:a,scale:n,speed:i}=r;return`
float ${e} = 0.5 + 0.5 * (
  sin(
    dot(${t}, ${s}) * ${n} -
    ${a} * ${i}
  ) * ${js.toFixed(2)} +
  sin(
    dot(
      ${t},
      vec2(-${s}.y, ${s}.x)
    ) * ${ks.toFixed(3)} +
    ${a} * ${Xs.toFixed(2)} +
    ${qs.toFixed(2)}
  ) * ${Ys.toFixed(2)}
);
`}const T=128,te=4,ae=11;function H(r,e,t){let s=Math.imul(r,374761393)^Math.imul(e,668265263)^t;return s=Math.imul(s^s>>>13,1274126177),((s^s>>>16)>>>0)/4294967296}function Fe(r,e,t,s){const a=Math.floor(r),n=Math.floor(e),i=r-a,o=e-n,d=i*i*(3-2*i),u=o*o*(3-2*o),c=(a%t+t)%t,D=(n%t+t)%t,g=(c+1)%t,f=(D+1)%t,x=H(c,D,s),_=H(g,D,s),E=H(c,f,s),S=H(g,f,s),R=x+(_-x)*d,w=E+(S-E)*d;return R+(w-R)*u}function Le(r){return Math.max(0,Math.min(255,Math.round(r*255)))}function tt(r=1597334677){const e=new Uint8Array(T*T*2);for(let s=0;s<T;s+=1)for(let a=0;a<T;a+=1){const n=a/T*te,i=s/T*te,o=Fe(n,i,te,r),d=Fe(a/T*ae,s/T*ae,ae,r^2654435769),u=(o+d*.5)/1.5,c=u*u*(3-2*u),D=(s*T+a)*2;e[D]=Le(c),e[D+1]=Le(d)}const t=new hs(e,T,T,ms,Oe);return t.name="grass-wind-noise",t.wrapS=ve,t.wrapT=ve,t.minFilter=k,t.magFilter=k,t.generateMipmaps=!1,t.colorSpace=Ue,t.needsUpdate=!0,t}let N;function xa(){return N||(N=tt()),N}function Ea(){N==null||N.dispose(),N=void 0}const at=.38,rt=1,it=1.48,ot=1.02,nt=.18,lt=.2,ut=.035,ct=.48,dt=.28,ht=.58,mt=.48,gt=.92,ft=1.04,vt=.55,St=0,Gt=.24,pt=.52,Dt=.42,bt=.58,m={tipStart:at,tipEnd:rt,tipLuminanceScale:it,dryLuminanceScale:ot,shadeDrynessPivot:nt,shadeDrynessScale:lt,shadeDrynessMaximum:ut,instanceDrynessBase:ct,instanceDrynessTip:dt,drynessMaximum:ht,rootFadeEnd:mt,shadeLightMinimum:gt,shadeLightMaximum:ft,shadowDesaturation:vt,groundContactStart:St,groundContactEnd:Gt,groundContactStrength:pt,groundContactBaseScale:Dt,groundContactDryScale:bt},P=new z(.2126,.7152,.0722);function h(r){if(!Number.isFinite(r))throw new TypeError("Grass palette GLSL values must be finite.");return Number.isInteger(r)?`${r}.0`:String(r)}function re(r){return r.r*P.x+r.g*P.y+r.b*P.z}function Ne(r,e,t,s,a,n){r.set(s),e.set(a),t.set(n);const i=Math.max(re(r),1e-4);e.multiplyScalar(i*m.tipLuminanceScale/Math.max(re(e),1e-4)),t.multiplyScalar(i*m.dryLuminanceScale/Math.max(re(t),1e-4))}const Tt=.62,Ct=h(Tt),Ve=`
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
      ${h(P.x)},
      ${h(P.y)},
      ${h(P.z)}
    ))),
    clamp(
      (1.0 - occlusion) * ${h(m.shadowDesaturation)},
      0.0,
      1.0
    )
  );
}
`,yt=1.29,xt=12,Et=.16,Rt=.55,Pe=.09,_t=42,Mt=18,Ie=.55,At=.00107,wt=1.15,Ft=3,Be=.06,Lt=30,Nt=64,Ra=Object.freeze({start:28,end:62,floor:.18}),He=`
#define GRASS_MAX_BIOMES ${q}
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
`,Pt=`
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
`,It=`
uniform float uGrassPixelWorldScale;
uniform float uGrassMinPixelWidth;
uniform float uGrassBladeHalfWidth;
uniform float uGrassMaxWidenDistance;
`,Bt=`
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
`,Wt=`
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
`,Ot=`
bool grassKeepLod = uGrassLodInvert < 0.5
  ? grassDither <= uGrassLodThreshold
  : grassDither > uGrassLodThreshold && grassDither <= uGrassDistanceFade;
`,Ut=`
uniform float uGrassLodThreshold;
uniform float uGrassDistanceFade;
`,Vt=`
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
`,Ht=`
varying float vGrassProgress;
varying float vGrassShade;
varying float vGrassDryness;
varying float vGrassRootAo;
flat varying float vGrassBiome;
varying float vGrassGust;
`,zt=`
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
  float grassWeather = ${Js("uGrassTime")};
  float grassTuftPhase = ${et("grassWorldRoot.xz")};
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

`,$t=`
vGrassSheen = vec2(
  (1.0 - smoothstep(
    uGrassSheenFadeDistance * 0.55,
    uGrassSheenFadeDistance,
    grassCameraDistance
  )) * (0.45 + 0.85 * grassGustNoise),
  mix(0.55, 1.0, grassProgress)
);
`,kt=`
vGrassSheen = vec2(0.0, mix(0.55, 1.0, grassProgress));
`,Xt=`
vec2 grassGustUv = grassWorldRoot.xz * uGrassWindNoiseScale -
  uGrassWindDirection * (uGrassTime * uGrassWindNoiseSpeed);
float grassGustNoise = texture2D(uGrassWindNoise, grassGustUv).r;
`,qt=st({target:"grassGustNoise",position:"grassWorldRoot.xz",windDirection:"uGrassWindDirection",time:"uGrassTime",scale:"uGrassGustFrontScale",speed:"uGrassGustFrontSpeed"}),jt=`
uniform sampler2D uGrassWindNoise;
uniform float uGrassWindNoiseScale;
uniform float uGrassWindNoiseSpeed;
`,Yt=`
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
`,Kt=`
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
`,Zt=`
vGrassProgress = grassProgress;
vGrassShade = mix(grassBladeShade, 0.5, (1.0 - grassMicroFade) * 0.86);
vGrassDryness = instanceVariation.w;
vGrassRootAo = instanceVariation.z;
vGrassBiome = instanceBiome;
vGrassGust = grassGustNoise;
`,Qt=`
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
`,Jt=`
${He}
uniform vec3 uGrassCanopyColor;
varying vec3 vGrassColor;
varying float vGrassProgress;
varying float vGrassDryness;
${Ve}
`,ea=`
${He}
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
${Ve}
`,sa=`
varying float vGrassGroundShade;
`,ta=`
diffuseColor.rgb *= vGrassGroundShade;
`,aa=`
uniform vec3 uGrassTipColor;
uniform float uGrassAmbientBoost;
uniform float uGrassBacklightStrength;
uniform float uGrassSheenStrength;
uniform float uGrassSheenPower;
varying vec3 vGrassColor;
varying vec2 vGrassSheen;
varying float vGrassProgress;
varying float vGrassDryness;
`,ra=`
#include <color_fragment>
diffuseColor.rgb = vGrassColor;
GRASS_GROUND_SHADE_APPLY
reflectedLight.indirectDiffuse += diffuseColor.rgb * uGrassAmbientBoost;
`,ia=`
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
`,oa=`
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
  mix(diffuseColor.rgb, grassLambertLight, ${Ct}) +
  mix(diffuseColor.rgb, uGrassTipColor, 0.35) *
    grassBackLight * uGrassBacklightStrength +
  grassSheen;
`,na=`
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
`,la=`
    sin(
      dot(grassWorldRoot.xz, vec2(-grassWindDirection.y, grassWindDirection.x)) /
        (uGrassGustScale * 0.37) +
      uGrassTime * uGrassFlutterSpeed +
      grassMotionPhase * 6.28318530718
    ) * mix(0.72, 1.18, instanceVariation.w)
`;function ie(r){return Array.from({length:q},()=>new oe(r))}function ua(r,e){return Array.from({length:q},()=>new A(r,e))}class _a{constructor(e){l(this,"material");l(this,"colorControls",{baseColor:"#273f22",tipColor:"#83a96b",dryColor:"#a8a06a"});l(this,"uniforms",{uGrassTime:{value:0},uGrassWindDirection:{value:new A(.8,.35).normalize()},uGrassWindStrength:{value:.14},uGrassGustScale:{value:.08},uGrassGustSpeed:{value:.65},uGrassFlutterStrength:{value:.035},uGrassFlutterSpeed:{value:3.4},uGrassBiomeBase:{value:ie(this.colorControls.baseColor)},uGrassBiomeTip:{value:ie(this.colorControls.tipColor)},uGrassBiomeDry:{value:ie(this.colorControls.dryColor)},uGrassBiomeShade:{value:ua(.55,.5)},uGrassTipColor:{value:new oe(this.colorControls.tipColor)},uGrassNormalUp:{value:.45},uGrassAmbientBoost:{value:.12},uGrassBacklightStrength:{value:.16},uGrassLodInvert:{value:0},uGrassLodThreshold:{value:1},uGrassDistanceFade:{value:1},uGrassDitherSeed:{value:0},uGrassWindLodScale:{value:1},uGrassNearDistance:{value:0},uGrassMidDistance:{value:0},uGrassTransitionDistance:{value:1},uGrassDetailMode:{value:0},uGrassDetailNearDistance:{value:0},uGrassDetailTransitionDistance:{value:1},uGrassArtDensityScale:{value:1},uGrassCanopyColor:{value:new oe("#4d923f")},uGrassBladeCurvature:{value:Rt},uGrassSheenStrength:{value:Pe},uGrassSheenPower:{value:_t},uGrassSheenFadeDistance:{value:Mt},uGrassGustFrontScale:{value:zs},uGrassGustFrontSpeed:{value:$s},uGrassGustFrontDepth:{value:Ie},uGrassGustTipBoost:{value:ye},uGrassWindNoise:{value:null},uGrassWindNoiseScale:{value:Vs},uGrassWindNoiseSpeed:{value:Hs},uGrassDensityFalloffStart:{value:Lt},uGrassDensityFalloffEnd:{value:Nt},uGrassDensityFloor:{value:1},uGrassLodDensityScale:{value:1},uGrassPixelWorldScale:{value:At},uGrassMinPixelWidth:{value:wt},uGrassBladeHalfWidth:{value:.017},uGrassMaxWidenDistance:{value:Be},uGrassTrailMap:{value:null},uGrassTrailCenter:{value:new A},uGrassTrailInverseCoverage:{value:1},uGrassTrailStrength:{value:0},uGrassTrailMaxAngle:{value:yt},uGrassTrailWobbleFrequency:{value:xt},uGrassTrailWobbleAmplitude:{value:Et},uGrassGroundShadowDisc:{value:new $(0,0,0,1)},uGrassGroundShadowStrength:{value:0}});l(this,"interactive");l(this,"baseWindStrength",.14);l(this,"baseFlutterStrength",.035);l(this,"artRootDarkening",.55);l(this,"artTipColorStrength",.5);this.interactive=e.interactive===!0,this.uniforms.uGrassLodInvert.value=e.invertLodCoverage?1:0,this.uniforms.uGrassWindLodScale.value=e.windLodScale??1,this.uniforms.uGrassDetailMode.value=e.detailMode??0,this.uniforms.uGrassDitherSeed.value=(e.ditherSeed??0)/4294967296,this.setPaletteColors(),this.material=new gs({side:fs,color:16777215,transparent:!1,depthWrite:!0}),this.material.name=e.name;const t=e.vertexPalette===!0,s=e.worldLod!==!1,a=e.subPixelWidth===!0,n=e.sheen!==!1,i=e.noiseWind===!0,o=e.microWind!==!1,d=e.instanceFreeDither===!0,u=s?Wt:Ot;this.material.onBeforeCompile=c=>{Object.assign(c.uniforms,this.uniforms),c.vertexShader=c.vertexShader.replace("#include <common>",`#include <common>${Pt}${this.interactive?Bt:""}${s?"":Ut}${a?It:""}${i?jt:""}${t?Jt:Ht}`).replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>${Vt}`).replace("#include <begin_vertex>",`#include <begin_vertex>${zt.replace("GRASS_KEEP_LOD",u).replace("GRASS_DITHER_INSTANCE_TERM",d?"":"instanceVariation.x +").replace("GRASS_GUST_NOISE",i?Xt:qt).replace("GRASS_FLUTTER_TERM",o?la:"0.0").replace("GRASS_SHEEN_VARYING",n?$t:kt).replace("GRASS_SUBPIXEL_WIDTH",a?Yt:"").replace("GRASS_TRAIL_BEND",this.interactive?Kt:"").replace("GRASS_GROUND_SHADE_INIT",this.interactive?"vGrassGroundShade = 1.0;":"")}${t?Qt:Zt}`),c.fragmentShader=c.fragmentShader.replace("#include <common>",`#include <common>${t?aa:ea}${this.interactive?sa:""}`).replace("#include <color_fragment>",(t?ra:ia).replace("GRASS_GROUND_SHADE_APPLY",this.interactive?ta:"")).replace("vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",oa.replace("GRASS_SHEEN_OUTPUT",n?na:""))},this.material.customProgramCacheKey=()=>e.cacheKey}configure(e,t){this.colorControls.baseColor=e.baseColor,this.colorControls.tipColor=e.tipColor,this.colorControls.dryColor=e.dryColor,this.artRootDarkening=e.rootDarkening,this.setPaletteColors(),this.uniforms.uGrassNormalUp.value=e.normalUp,this.uniforms.uGrassAmbientBoost.value=e.ambientBoost,this.uniforms.uGrassBacklightStrength.value=e.backlightStrength,this.uniforms.uGrassWindDirection.value.set(t.directionX,t.directionZ).normalize(),this.baseWindStrength=t.strength,this.baseFlutterStrength=t.flutterStrength,this.uniforms.uGrassWindStrength.value=t.strength,this.uniforms.uGrassGustScale.value=t.gustScale,this.uniforms.uGrassGustSpeed.value=t.gustSpeed,this.uniforms.uGrassFlutterStrength.value=t.flutterStrength,this.uniforms.uGrassFlutterSpeed.value=t.flutterSpeed}applyArtDirection(e){this.colorControls.baseColor=e.baseColor,this.colorControls.tipColor=e.tipColor,this.colorControls.dryColor=e.dryColor,this.artRootDarkening=e.rootDarkening,this.artTipColorStrength=e.tipColorStrength,this.setPaletteColors(),this.uniforms.uGrassNormalUp.value=e.normalUp,this.uniforms.uGrassAmbientBoost.value=e.ambientBoost,this.uniforms.uGrassBacklightStrength.value=e.backlightStrength,this.uniforms.uGrassArtDensityScale.value=e.densityScale,this.uniforms.uGrassWindStrength.value=this.baseWindStrength*e.windStrengthScale,this.uniforms.uGrassFlutterStrength.value=this.baseFlutterStrength*e.flutterStrengthScale,this.configureGust(e.gustDepth??Ie,e.gustTipBoost??ye),this.uniforms.uGrassCanopyColor.value.set(e.terrainGrassColor),this.uniforms.uGrassSheenFadeDistance.value=e.nearDistance}setViewportPixelScale(e){Number.isFinite(e)&&e>0&&(this.uniforms.uGrassPixelWorldScale.value=e)}setBladeHalfWidth(e){const t=Math.max(e,1e-4);this.uniforms.uGrassBladeHalfWidth.value=t,this.uniforms.uGrassMaxWidenDistance.value=Math.min(t*Ft,Be)}getDitherSeed(){return this.uniforms.uGrassDitherSeed.value}setLodThreshold(e,t=1){this.uniforms.uGrassLodThreshold.value=e,this.uniforms.uGrassDistanceFade.value=t}configureLod(e){this.uniforms.uGrassNearDistance.value=e.nearMaxDistance,this.uniforms.uGrassMidDistance.value=e.midMaxDistance,this.uniforms.uGrassTransitionDistance.value=e.transitionDistance}configureDetailLod(e){this.uniforms.uGrassDetailNearDistance.value=e.nearMaxDistance,this.uniforms.uGrassDetailTransitionDistance.value=e.transitionDistance}update(e){if(this.uniforms.uGrassTime.value=e,!!this.interactive){if(ee.isEnabled()?(this.uniforms.uGrassGroundShadowDisc.value.copy(ee.disc),this.uniforms.uGrassGroundShadowStrength.value=ee.strength):this.uniforms.uGrassGroundShadowStrength.value=0,!V.isEnabled()){this.uniforms.uGrassTrailStrength.value=0;return}this.uniforms.uGrassTrailMap.value=V.getTexture(),this.uniforms.uGrassTrailCenter.value.copy(V.getCenter()),this.uniforms.uGrassTrailInverseCoverage.value=V.getInverseCoverage(),this.uniforms.uGrassTrailStrength.value=1}}configureTrail(e){this.uniforms.uGrassTrailMaxAngle.value=e.maxAngleRadians,this.uniforms.uGrassTrailWobbleFrequency.value=e.wobbleFrequency,this.uniforms.uGrassTrailWobbleAmplitude.value=e.wobbleAmplitude}setPaletteColors(){const e=this.uniforms.uGrassBiomeBase.value,t=this.uniforms.uGrassBiomeTip.value,s=this.uniforms.uGrassBiomeDry.value,a=this.uniforms.uGrassBiomeShade.value;Ne(e[0],t[0],s[0],this.colorControls.baseColor,this.colorControls.tipColor,this.colorControls.dryColor),a[0].set(this.artRootDarkening,this.artTipColorStrength),this.uniforms.uGrassTipColor.value.copy(t[0]);for(let n=1;n<q;n+=1){const i=vs[n];if(!i||i.paletteSource==="art"){e[n].copy(e[0]),t[n].copy(t[0]),s[n].copy(s[0]),a[n].copy(a[0]);continue}Ne(e[n],t[n],s[n],i.baseColor,i.tipColor,i.dryColor),a[n].set(i.rootDarkening,i.tipColorStrength)}}setWindNoise(e,t,s){this.uniforms.uGrassWindNoise.value=e,this.uniforms.uGrassWindNoiseScale.value=t,this.uniforms.uGrassWindNoiseSpeed.value=s}configureDensityFalloff(e,t,s){this.uniforms.uGrassDensityFalloffStart.value=e,this.uniforms.uGrassDensityFalloffEnd.value=t,this.uniforms.uGrassDensityFloor.value=s}getDensityFalloff(){return{start:this.uniforms.uGrassDensityFalloffStart.value,end:this.uniforms.uGrassDensityFalloffEnd.value,floor:this.uniforms.uGrassDensityFloor.value}}setLodDensityScale(e){this.uniforms.uGrassLodDensityScale.value=C.clamp(e,.05,1)}getLodDensityScale(){return this.uniforms.uGrassLodDensityScale.value}configureGust(e,t){this.uniforms.uGrassGustFrontDepth.value=e,this.uniforms.uGrassGustTipBoost.value=t}setSheenEnabled(e){this.uniforms.uGrassSheenStrength.value=e?Pe:0}setupGUI(e,t=[]){const s=[this,...t],a=e.addFolder("Grass Props");a.addColor(this.colorControls,"baseColor").onChange(i=>{for(const o of s)o.colorControls.baseColor=i,o.setPaletteColors()}),a.addColor(this.colorControls,"tipColor").onChange(i=>{for(const o of s)o.colorControls.tipColor=i,o.setPaletteColors()}),a.addColor(this.colorControls,"dryColor").onChange(i=>{for(const o of s)o.colorControls.dryColor=i,o.setPaletteColors()});const n={value:this.artTipColorStrength};a.add(n,"value",.15,.75,.01).name("Tip Mix").onChange(i=>{for(const o of s)o.artTipColorStrength=i,o.setPaletteColors()}),a.add(this.uniforms.uGrassWindStrength,"value",0,.45,.005).name("Wind Strength").onChange(i=>{for(const o of t)o.uniforms.uGrassWindStrength.value=i}),a.add(this.uniforms.uGrassFlutterStrength,"value",0,.15,.0025).name("Tip Flutter").onChange(i=>{for(const o of t)o.uniforms.uGrassFlutterStrength.value=i}),a.add(this.uniforms.uGrassNormalUp,"value",0,.9,.01).name("Normal Up").onChange(i=>{for(const o of t)o.uniforms.uGrassNormalUp.value=i}),a.add(this.uniforms.uGrassAmbientBoost,"value",0,.4,.01).name("Ambient Boost").onChange(i=>{for(const o of t)o.uniforms.uGrassAmbientBoost.value=i}),a.add(this.uniforms.uGrassBacklightStrength,"value",0,.5,.01).name("Backlight").onChange(i=>{for(const o of t)o.uniforms.uGrassBacklightStrength.value=i}),a.add(this.uniforms.uGrassBladeCurvature,"value",0,1.2,.01).name("Blade Curve").onChange(i=>{for(const o of t)o.uniforms.uGrassBladeCurvature.value=i}),a.add(this.uniforms.uGrassSheenStrength,"value",0,.3,.005).name("Sheen").onChange(i=>{for(const o of t)o.uniforms.uGrassSheenStrength.value=i}),a.add(this.uniforms.uGrassSheenPower,"value",8,96,1).name("Sheen Focus").onChange(i=>{for(const o of t)o.uniforms.uGrassSheenPower.value=i}),a.add(this.uniforms.uGrassGustFrontDepth,"value",0,.9,.01).name("Gust Fronts").onChange(i=>{for(const o of t)o.uniforms.uGrassGustFrontDepth.value=i}),a.add(this.uniforms.uGrassGustFrontSpeed,"value",0,1.6,.01).name("Gust Speed").onChange(i=>{for(const o of t)o.uniforms.uGrassGustFrontSpeed.value=i}),a.open()}}const ca=.1;class Ma{constructor(){l(this,"elapsedSeconds",0)}update(e){return!Number.isFinite(e)||e<=0?this.elapsedSeconds:(this.elapsedSeconds+=Math.min(e,ca),this.elapsedSeconds)}}function Aa(){const r=Math.max(1,window.innerWidth),e=Math.max(1,window.innerHeight);return{width:r,height:e,aspect:r/e}}function wa(r){const e=window.devicePixelRatio,t=Number.isFinite(e)&&e>0?e:1;return Math.min(t,r)}export{$s as A,zs as B,xa as C,Ra as D,Ea as E,fa as G,Ts as S,Ma as W,va as a,_a as b,Ca as c,ya as d,p as e,wa as f,ee as g,V as h,Se as i,Ss as j,Ga as k,ba as l,Ta as m,pa as n,Sa as o,ye as p,Hs as q,Aa as r,Ne as s,Vs as t,xs as u,Ve as v,Ct as w,st as x,Js as y,Da as z};
