import { cacheForRoom } from "./cache-util";

export const structuresToRepair = cacheForRoom(room =>
  room
    .find(FIND_STRUCTURES)
    .filter(
      s =>
        (s.structureType !== "constructedWall" && s.structureType !== "rampart" && s.hitsMax / 2 > s.hits) ||
        s.hits / 100 > s.hits
    )
);

const mySpawnsCache = cacheForRoom(room => room.find(FIND_MY_SPAWNS).map(s => s.id));
export const mySpawns = (room: Room, time: number): StructureSpawn[] =>
  mySpawnsCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as StructureSpawn[];

export const extensionsToSpawnFrom = cacheForRoom(room => {
  const spawns = mySpawns(room, 50).map(s => s.pos);
  return _.sortBy(
    room.find(FIND_MY_STRUCTURES).filter(s => s.structureType === "extension" || s.structureType === "spawn"),
    s => _.sum(spawns, spawn => spawn.getRangeTo(s))
  ).map(s => s.id);
});
