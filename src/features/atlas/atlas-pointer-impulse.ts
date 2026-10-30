import { atlasSelectionDuration } from "./atlas-motion-settings";
import { nearestAtlasString, type AtlasString } from "./atlas-string-response";

// CSS pixels/second; speed comes from the actual movement, not event frequency.
export const atlasPointerImpulseReference = { minimumSpeed: 25, speedScale: 450, maximumGain: 2.4, cooldown: .18, rearmPause: .12 };

/** A passage excites each strand once; its packets continue after the cursor leaves. */
export function advanceAtlasPointer(line: AtlasString, x: number, y: number, over: boolean, speed: number, strength: number, dt: number, unit: number, mouseRadius: number) {
  const state = line.pointer, config = atlasPointerImpulseReference;
  for (const impulse of state.impulses) if (impulse.age >= 0) {
    impulse.age += dt;
    if (impulse.age >= atlasSelectionDuration) { impulse.age = -1; impulse.value = 0; }
  }
  state.cooldown = Math.max(0, state.cooldown - dt);
  state.quietTime = speed < config.minimumSpeed ? state.quietTime + dt : 0;
  if (state.quietTime >= config.rearmPause) state.armed = true;
  const radius = mouseRadius * unit;
  if (!over || strength <= 0 || x < line.left-radius*1.2 || x > line.right+radius*1.2 || y < line.top-radius*1.2 || y > line.bottom+radius*1.2) {
    state.armed = true; return;
  }
  if (speed < config.minimumSpeed) return;
  const hit = nearestAtlasString(line,x,y);
  if (hit.distance2 > radius*radius*1.44) { state.armed = true; return; }
  let travel = Math.abs(hit.contact - state.lastContact);
  if (line.closed) travel = Math.min(travel,line.length-travel);
  if (travel > radius*1.1 && state.cooldown === 0) state.armed = true;
  if (!state.armed || state.cooldown > 0 || speed < config.minimumSpeed || hit.distance2 > radius*radius) return;
  // Two independent slots avoid restarting a wave or accumulating unlimited energy.
  const impulse = state.impulses.find(item => item.age < 0);
  if (!impulse) return;
  const energy = 1 - Math.exp(-speed / config.speedScale);
  const value = 11 * unit * strength / 100 * config.maximumGain * energy * hit.signed / Math.hypot(hit.signed,8*unit) * Math.exp(-.5*hit.distance2/(radius*radius));
  if (!Number.isFinite(value) || Math.abs(value) < .025*unit) return;
  impulse.contact = hit.contact; impulse.value = value; impulse.age = .035;
  state.lastContact = hit.contact; state.cooldown = config.cooldown; state.armed = false; state.quietTime = 0;
}
