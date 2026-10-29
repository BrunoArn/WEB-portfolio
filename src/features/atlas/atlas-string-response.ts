import { atlasBendLimits } from "./atlas-contour-safety";
import type { AtlasContour } from "./atlas-types";

/** A contour behaves as a separate strand, with its own nearest contact and return. */
export function createAtlasString(contour: AtlasContour, scale = 1) {
  const { path, closed } = contour, arcs = new Float64Array(path.length), normals = new Float32Array(path.length * 2);
  const samples: number[] = [];
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (let i = 0; i < path.length; i++) {
    const p = path[i], before = path[closed ? (i - 1 + path.length) % path.length : Math.max(0,i-1)], after = path[closed ? (i+1) % path.length : Math.min(path.length-1,i+1)];
    if (i) arcs[i] = arcs[i-1] + Math.hypot(p[0]-path[i-1][0],p[1]-path[i-1][1]);
    const dx = after[0]-before[0], dy = after[1]-before[1], length = Math.hypot(dx,dy) || 1;
    normals[i*2] = -dy/length; normals[i*2+1] = dx/length;
    left = Math.min(left,p[0]); right = Math.max(right,p[0]); top = Math.min(top,p[1]); bottom = Math.max(bottom,p[1]);
    if (!samples.length || arcs[i]-samples.at(-1)! >= 4 || i===path.length-1) samples.push(p[0],p[1],arcs[i]);
  }
  const length = arcs.at(-1)! + (closed ? Math.hypot(path[0][0]-path.at(-1)![0],path[0][1]-path.at(-1)![1]) : 0);
  if (closed) samples.push(path[0][0],path[0][1],length);
  const bendLimits = atlasBendLimits(contour, arcs, normals, scale);
  return { arcs, normals, bendLimits, samples: new Float64Array(samples), closed, length, left, top, right, bottom, value: 0, contact: 0, strike: undefined as { contact: number; value: number } | undefined };
}
export type AtlasString = ReturnType<typeof createAtlasString>;
/** Closest contact belongs to this contour, irrespective of its winding. */
export function nearestAtlasString(line: AtlasString, x: number, y: number) {
  let distance2 = Infinity, signed = 0, contact = 0;
  const p = line.samples;
  for (let i=3; i<p.length; i+=3) {
    const vx=p[i]-p[i-3], vy=p[i+1]-p[i-2], length2=vx*vx+vy*vy;
    if (!length2) continue;
    const t=Math.max(0,Math.min(1,((x-p[i-3])*vx+(y-p[i-2])*vy)/length2));
    const dx=p[i-3]+t*vx-x, dy=p[i-2]+t*vy-y, candidate=dx*dx+dy*dy;
    if (candidate<distance2) { distance2=candidate; signed=(-vy*dx+vx*dy)/Math.sqrt(length2); contact=p[i-1]+t*(p[i+2]-p[i-1]); }
  }
  return {distance2,signed,contact};
}
export function advanceAtlasString(line: AtlasString, x: number, y: number, over: boolean, strength: number, returnTime: number, dt: number, unit: number, mouseRadius = 35) {
  let target = 0, contact = line.contact;
  const radius = mouseRadius*unit;
  if (over && strength > 0 && x>line.left-radius*2 && x<line.right+radius*2 && y>line.top-radius*2 && y<line.bottom+radius*2) {
    const hit = nearestAtlasString(line,x,y);
    contact = hit.contact;
    if (Number.isFinite(hit.distance2)) target = strength/100 * 12*unit * hit.signed/Math.hypot(hit.signed,8*unit) * Math.exp(-2*hit.distance2/(radius*radius));
  }
  if (Math.abs(line.value)<.001*unit) line.contact=contact;
  else {
    let delta=contact-line.contact;
    if (line.closed) { if (delta>line.length/2) delta-=line.length; if (delta<-line.length/2) delta+=line.length; }
    line.contact += delta*(1-Math.exp(-dt/.07));
    if (line.closed) line.contact=(line.contact%line.length+line.length)%line.length;
  }
  const tau=target ? .075 : .12+returnTime/100*1.2;
  line.value += (target-line.value)*(1-Math.exp(-dt/tau));
}
/** A click excites each strand at its own nearest contact, like a brief pointer push. */
export function strikeAtlasString(line: AtlasString, x: number, y: number, unit: number, mouseRadius = 35) {
  const hit=nearestAtlasString(line,x,y), radius=Math.max(75,mouseRadius*2)*unit;
  const value=11*unit * hit.signed/Math.hypot(hit.signed,8*unit) * Math.exp(-.5*hit.distance2/(radius*radius));
  line.strike=Number.isFinite(value) && Math.abs(value)>.005*unit ? {contact:hit.contact,value} : undefined;
}
