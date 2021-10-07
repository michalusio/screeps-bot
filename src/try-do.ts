export function tryDo<T, U>(fn: (...args: U[]) => T, ...args: U[]): T | void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tryDo<T>(fn: (...args: any[]) => T, ...args: unknown[]): T | void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tryDo<T>(fn: (...args: any[]) => T, ...args: unknown[]): T | void {
  try {
    const cpuBefore = Game.cpu.getUsed();
    const result = fn(...args);
    //#if _PROFILER
    if (!Memory.timings) Memory.timings = {};
    if (!Memory.timings[Game.time]) Memory.timings[Game.time] = {};
    Memory.timings[Game.time][fn.name] = (Memory.timings[Game.time][fn.name] ?? 0) + Game.cpu.getUsed() - cpuBefore;
    //#endif
    return result;
  } catch (e) {
    console.log(`Error encountered at ${fn.name}:`);
    if (e instanceof Error) {
      console.log(e.stack);
      console.log(e.message);
    } else console.log(e);
  }
}
