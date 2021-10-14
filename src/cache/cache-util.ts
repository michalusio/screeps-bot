type KeysOfType<T, U, B = false> = {
  [P in keyof T]: B extends true ? (T[P] extends U ? (U extends T[P] ? P : never) : never) : T[P] extends U ? P : never;
}[keyof T];

export const cacheHits: { [key: string]: { hits: number; cpu: number } } = {};

export type RoomCache<T> = ((room: Room, time: number) => T) & { has(room: Room, time: number): boolean };
export type StructCache<U, T> = ((struct: U, time: number) => T) & {
  has(struct: U, time: number): boolean;
  set(struct: U, value: T): void;
};

export function cache<T>(name: string, get: () => T): (time: number) => T {
  const cache: [T, number] = [get(), Game.time];
  return (time: number) => {
    if (Game.time - cache[1] > time) {
      if (!cacheHits[name]) cacheHits[name] = { hits: 0, cpu: 0 };
      const cpuBefore = Game.cpu.getUsed();
      cache[0] = get();
      cacheHits[name].hits++;
      cacheHits[name].cpu += Game.cpu.getUsed() - cpuBefore;
      cache[1] = Game.time;
    }
    return cache[0];
  };
}

export function cacheForKey<S extends string, T>(name: string, get: (key: S) => T): (key: S, time: number) => T {
  const cache: Map<string, [T, number]> = new Map();
  return (key: S, time: number) => {
    let cacheValue = cache.get(key);
    if (!cacheValue || Game.time - cacheValue[1] > time) {
      if (!cacheHits[name]) cacheHits[name] = { hits: 0, cpu: 0 };
      const cpuBefore = Game.cpu.getUsed();
      cacheValue = [get(key), Game.time];
      cacheHits[name].hits++;
      cacheHits[name].cpu += Game.cpu.getUsed() - cpuBefore;
      cache.set(key, cacheValue);
    }
    return cacheValue[0];
  };
}

export function cacheForStruct<U, T>(
  name: string,
  get: (struct: U) => T,
  key: KeysOfType<U, string, false>
): StructCache<U, T> {
  const cache: Map<KeysOfType<U, string, true>, [T, number]> = new Map();
  return Object.assign(
    (struct: U, time: number) => {
      const getKey = struct[key];
      let cacheValue = cache.get(getKey);
      if (!cacheValue || Game.time - cacheValue[1] > time) {
        if (!cacheHits[name]) cacheHits[name] = { hits: 0, cpu: 0 };
        const cpuBefore = Game.cpu.getUsed();
        cacheValue = [get(struct), Game.time];
        cacheHits[name].hits++;
        cacheHits[name].cpu += Game.cpu.getUsed() - cpuBefore;
        cache.set(getKey, cacheValue);
      }
      return cacheValue[0];
    },
    {
      has: (struct: U, time: number) => {
        const item = cache.get(struct[key]);
        return item != null ? Game.time - item[1] <= time : false;
      },
      set: (struct: U, value: T) => {
        cache.set(struct[key], [value, Game.time]);
      }
    }
  );
}

export function cacheForRoom<T>(name: string, get: (room: Room, time: number) => T): RoomCache<T> {
  const cache: Map<string, [T, number]> = new Map();
  return Object.assign(
    (room: Room, time: number) => {
      let fromCache = cache.get(room.name);
      if (!fromCache || Game.time - fromCache[1] > time) {
        if (!cacheHits[name]) cacheHits[name] = { hits: 0, cpu: 0 };
        const cpuBefore = Game.cpu.getUsed();
        fromCache = [get(room, time), Game.time];
        cacheHits[name].hits++;
        cacheHits[name].cpu += Game.cpu.getUsed() - cpuBefore;
        cache.set(room.name, fromCache);
      }
      return fromCache[0];
    },
    {
      has: (room: Room, time: number) => {
        const item = cache.get(room.name);
        return item != null ? Game.time - item[1] <= time : false;
      }
    }
  );
}

export function cacheForRoomKeys<T, U extends string>(
  name: string,
  get: (room: Room, key: U) => T
): (room: Room, key: U, time: number) => T {
  const cache: Map<string, Map<string, [T, number]>> = new Map();
  return (room: Room, key: U, time: number) => {
    let fromCache = cache.get(room.name);
    if (!fromCache) {
      fromCache = new Map();
      cache.set(room.name, fromCache);
    }
    let fromCache2 = fromCache.get(key);
    if (!fromCache2 || Game.time - fromCache2[1] > time) {
      if (!cacheHits[name]) cacheHits[name] = { hits: 0, cpu: 0 };
      const cpuBefore = Game.cpu.getUsed();
      fromCache2 = [get(room, key), Game.time];
      cacheHits[name].hits++;
      cacheHits[name].cpu += Game.cpu.getUsed() - cpuBefore;
      fromCache.set(key, fromCache2);
    }
    return fromCache2[0];
  };
}

export function cacheForRoomStruct<T, U>(
  name: string,
  get: (room: Room, struct: U) => T,
  key: KeysOfType<U, string, true>
): (room: Room, struct: U, time: number) => T {
  const cache: Map<string, Map<string, [T, number]>> = new Map();
  return (room: Room, struct: U, time: number) => {
    const getKey = struct[key];
    let fromCache = cache.get(room.name);
    if (!fromCache) {
      fromCache = new Map();
      cache.set(room.name, fromCache);
    }
    let fromCache2 = fromCache.get(getKey);
    if (!fromCache2 || Game.time - fromCache2[1] > time) {
      if (!cacheHits[name]) cacheHits[name] = { hits: 0, cpu: 0 };
      const cpuBefore = Game.cpu.getUsed();
      fromCache2 = [get(room, struct), Game.time];
      cacheHits[name].hits++;
      cacheHits[name].cpu += Game.cpu.getUsed() - cpuBefore;
      fromCache.set(getKey, fromCache2);
    }
    return fromCache2[0];
  };
}

export function cacheForRoomStructKey<T, U>(
  name: string,
  get: (room: Room, struct: U) => T,
  key: (struct: U) => string
): (room: Room, struct: U, time: number) => T {
  const cache: Map<string, Map<string, [T, number]>> = new Map();
  return (room: Room, struct: U, time: number) => {
    const getKey = key(struct);
    let fromCache = cache.get(room.name);
    if (!fromCache) {
      fromCache = new Map();
      cache.set(room.name, fromCache);
    }
    let fromCache2 = fromCache.get(getKey);
    if (!fromCache2 || Game.time - fromCache2[1] > time) {
      if (!cacheHits[name]) cacheHits[name] = { hits: 0, cpu: 0 };
      const cpuBefore = Game.cpu.getUsed();
      fromCache2 = [get(room, struct), Game.time];
      cacheHits[name].hits++;
      cacheHits[name].cpu += Game.cpu.getUsed() - cpuBefore;
      fromCache.set(getKey, fromCache2);
    }
    return fromCache2[0];
  };
}
