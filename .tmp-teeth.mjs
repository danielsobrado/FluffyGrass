import { createServer } from "vite";
const server = await createServer({ configFile:false, root:"f:/Development/FluffyGrass", appType:"custom",
  logLevel:"silent", server:{middlewareMode:true,watch:null}, optimizeDeps:{noDiscovery:true} });
try {
  const M = await server.ssrLoadModule("/src/world/stones/StoneLatestRegressionVerification.ts");
  const src = await server.ssrLoadModule("/src/world/WorldConfigLoader.ts").catch(()=>null);
  // call only the ground check via the exported aggregate is heavy; probe directly:
  const C = await server.ssrLoadModule("/src/world/stones/StoneClipper.ts");
  const Q = await server.ssrLoadModule("/src/world/stones/StoneShapeQuality.ts");
  const R = await server.ssrLoadModule("/src/world/stones/StoneRecipe.ts");
  let bad=0;
  for (const a of R.STONE_ARCHETYPE_IDS) for (let v=0;v<200;v+=1){
    const seed=(v*2654435761 + a.length*977)>>>0;
    const rec=Q.resolveQualityStoneRecipe(a,seed);
    const f=C.facesFromPlanes(C.buildStoneSurfacePlanes(rec,true));
    if (f.filter(x=>x.role==="bottom").length===0) bad+=1;
  }
  console.log(bad>0 ? `REGRESSION HAS TEETH: ${bad}/1200 bodies lose ground contact without the fix` : "NO DETECTION - test is toothless");
} finally { await server.close(); }
