type KeysOfType<T, U, B = false> = {
  [P in keyof T]: B extends true ? (T[P] extends U ? (U extends T[P] ? P : never) : never) : T[P] extends U ? P : never;
}[keyof T];

export function cache<T>(get: () => T): (time: number) => T {
  const cache: [T, number] = [get(), Game.time];
  return (time: number) => {
    if (Game.time - cache[1] > time) {
      cache[0] = get();
      cache[1] = Game.time;
    }
    return cache[0];
  };
}

export function cacheForRoom<T>(get: (room: Room) => T): (room: Room, time: number) => T {
  const cache: Map<string, [T, number]> = new Map();
  return (room: Room, time: number) => {
    let fromCache = cache.get(room.name);
    if (!fromCache || Game.time - fromCache[1] > time) {
      fromCache = [get(room), Game.time];
      cache.set(room.name, fromCache);
    }
    return fromCache[0];
  };
}

export function cacheForRoomKeys<T, U extends string>(
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
      fromCache2 = [get(room, key), Game.time];
      fromCache.set(key, fromCache2);
    }
    return fromCache2[0];
  };
}

export function cacheForRoomStruct<T, U>(
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
      fromCache2 = [get(room, struct), Game.time];
      fromCache.set(getKey, fromCache2);
    }
    return fromCache2[0];
  };
}
