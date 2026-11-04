import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const loaded = {exports:{}};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/features/atlas/atlas-contour-safety.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:loaded.exports,module:loaded,Float32Array,Float64Array});
const {atlasBendLimits}=loaded.exports;

// Exhaustive reference: every sampled point is considered without spatial pruning.
function reference(contour,arcs,normals,scale){
 const spacing=Math.min(2,4/scale),radius=32/scale/.35,search=radius*2,samples=[];
 let last=-Infinity;
 for(let i=0;i<arcs.length;i++)if(arcs[i]-last>=spacing){samples.push(i);last=arcs[i];}
 const rooms=samples.map(index=>{const [x,y]=contour.path[index];let room=radius;
  for(const other of samples){if(other===index)continue;const q=contour.path[other],dx=q[0]-x,dy=q[1]-y,distance2=dx*dx+dy*dy,projection=Math.abs(dx*normals[index*2]+dy*normals[index*2+1]);
   if(projection>1e-8&&distance2>1e-8&&distance2<search*search)room=Math.min(room,distance2/(2*projection));}
  return Math.max(.0001,room*.35);});
 const safe=rooms.map((v,i)=>Math.min(v,rooms[(i+rooms.length-1)%rooms.length],rooms[(i+1)%rooms.length]));
 const first=contour.path[0],end=contour.path.at(-1),length=arcs.at(-1)+Math.hypot(first[0]-end[0],first[1]-end[1]);
 for(let pass=0;pass<2;pass++){
  for(let i=0;i<safe.length;i++){const before=(i+safe.length-1)%safe.length,distance=i?arcs[samples[i]]-arcs[samples[before]]:length-arcs[samples[before]];safe[i]=Math.min(safe[i],safe[before]+distance*.15);}
  for(let i=safe.length-1;i>=0;i--){const after=(i+1)%safe.length,distance=after?arcs[samples[after]]-arcs[samples[i]]:length-arcs[samples[i]];safe[i]=Math.min(safe[i],safe[after]+distance*.15);}}
 const limits=new Float32Array(arcs.length);let sample=0;
 for(let i=0;i<arcs.length;i++){while(sample+1<samples.length&&arcs[samples[sample+1]]<=arcs[i])sample++;const next=(sample+1)%samples.length,start=arcs[samples[sample]],finish=next?arcs[samples[next]]:length,t=Math.min(1,(arcs[i]-start)/Math.max(1e-8,finish-start)),blend=t*t*(3-2*t);limits[i]=safe[sample]*(1-blend)+safe[next]*blend;}
 return limits;
}
function shape(seed,thin=false){
 const n=240+seed*7,path=Array.from({length:n},(_,i)=>{const t=i/n*Math.PI*2,r=100+32*Math.sin(t*3+seed)+13*Math.cos(t*7-seed);return [r*Math.cos(t)+seed*37-300,r*Math.sin(t)*(thin?.08:1)+seed*19-220];});
 const arcs=new Float64Array(n),normals=new Float32Array(n*2);
 path.forEach((p,i)=>{if(i)arcs[i]=arcs[i-1]+Math.hypot(p[0]-path[i-1][0],p[1]-path[i-1][1]);const a=path[(i+n-1)%n],b=path[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;normals[i*2]=-dy/l;normals[i*2+1]=dx/l;});
 return {contour:{path,closed:true},arcs,normals};
}
for(const scale of [.25,.75,1,2,4])test('clearance is unchanged at scale '+scale,()=>{
 for(let seed=0;seed<12;seed++)for(const thin of [false,true]){const {contour,arcs,normals}=shape(seed,thin);assert.deepEqual(atlasBendLimits(contour,arcs,normals,scale),reference(contour,arcs,normals,scale));}
});
test('cached limits are reused only at the same scale; open strands retain their allowance',()=>{
 const {contour,arcs,normals}=shape(1);const a=atlasBendLimits(contour,arcs,normals,1);assert.equal(atlasBendLimits(contour,arcs,normals,1),a);assert.notEqual(atlasBendLimits(contour,arcs,normals,2),a);
 contour.closed=false;assert.ok(atlasBendLimits(contour,arcs,normals,4).every(v=>v===250000));
});
