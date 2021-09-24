/* eslint-disable */
// @ts-nocheck
global.lastMemoryTick = undefined;
export function initMemHack() {
  if (lastMemoryTick && global.LastMemory && Game.time == lastMemoryTick + 1) {
    delete global.Memory;
    global.Memory = global.LastMemory;
    RawMemory._parsed = global.LastMemory;
  } else {
    Memory;
    global.LastMemory = RawMemory._parsed;
  }
  lastMemoryTick = Game.time;
}
