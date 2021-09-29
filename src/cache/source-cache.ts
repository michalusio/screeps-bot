import { cacheForRoom } from "./cache-util";

const sourcesCache = cacheForRoom(room => room.find(FIND_SOURCES).map(s => s.id));
export const sources = (room: Room, time: number): Source[] =>
  sourcesCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as Source[];

export const activeSources = (room: Room, time: number): Source[] =>
  sourcesCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null && s.energy > 0) as Source[];
