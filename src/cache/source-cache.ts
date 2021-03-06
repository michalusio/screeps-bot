import { cacheForRoom } from "./cache-util";

const sourcesCache = cacheForRoom("sources", room => room.find(FIND_SOURCES).map(s => s.id));
export const sources = (room: Room, time: number): Source[] =>
  sourcesCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as Source[];

const sourcesAndMineralCache = cacheForRoom("sources and mineral", room => {
  return [...room.find(FIND_SOURCES).map(s => s.id), ...room.find(FIND_MINERALS).map(m => m.id)];
});
export const sourcesAndMineral = (room: Room, time: number): (Source | Mineral<MineralConstant>)[] =>
  sourcesAndMineralCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as (Source | Mineral<MineralConstant>)[];

export const activeSources = (room: Room, time: number): Source[] =>
  sourcesCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null && s.energy > 0) as Source[];

const droppedEnergyCache = cacheForRoom("dropped energy", room =>
  room
    .find(FIND_DROPPED_RESOURCES)
    .filter(r => r.resourceType === RESOURCE_ENERGY && r.amount > 10)
    .map(e => e.id)
);
export const droppedEnergy = (room: Room, time: number): Resource<"energy">[] =>
  droppedEnergyCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(e => e != null) as Resource<"energy">[];
