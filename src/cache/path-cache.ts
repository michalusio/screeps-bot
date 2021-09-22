const pathsCache = new Map<{ x1: number, y1: number, x2: number, y2: number, room: string}, PathStep[]>();

export function getPathFromCache(a: RoomPosition | _HasRoomPosition, b: RoomPosition | _HasRoomPosition, room: Room): RoomPosition[] {
  const aPos = (a as _HasRoomPosition).pos || a;
  const bPos = (b as _HasRoomPosition).pos || b;

  const key = { x1: aPos.x, y1: aPos.y, x2: bPos.x, y2: bPos.y, room: room.name };
  const fromCache = pathsCache.get(key);
  if (fromCache) return fromCache.map(step => new RoomPosition(step.x, step.y, room.name));

  const path = room.findPath(aPos, bPos, { ignoreCreeps: true, ignoreRoads: true });
  pathsCache.set(key, path);
  return path.map(step => new RoomPosition(step.x, step.y, room.name));
}
