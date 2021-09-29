import { cacheForRoom } from "./cache-util";

type PathKey = `{ ${number} ${number} | ${number} ${number} | ${string} ${boolean} }`;

const pathsCache = new Map<PathKey, PathStep[]>();

export function getPathFromCache(
  a: RoomPosition | _HasRoomPosition,
  b: RoomPosition | _HasRoomPosition,
  room: Room,
  ignoreRoads = true
): RoomPosition[] {
  const aPos = (a as _HasRoomPosition).pos || a;
  const bPos = (b as _HasRoomPosition).pos || b;

  const key: PathKey = `{ ${aPos.x} ${aPos.y} | ${bPos.x} ${bPos.y} | ${room.name} ${ignoreRoads} }`;
  const fromCache = pathsCache.get(key);
  if (fromCache) return fromCache.map(step => new RoomPosition(step.x, step.y, room.name));

  const path = room.findPath(aPos, bPos, { ignoreCreeps: true, ignoreRoads });
  pathsCache.set(key, path);
  return path.map(step => new RoomPosition(step.x, step.y, room.name));
}

export const exits = cacheForRoom(room => room.find(FIND_EXIT));
