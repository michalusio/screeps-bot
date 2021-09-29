import { cacheForRoom } from "./cache-util";

export const structures = cacheForRoom(room => room.find(FIND_STRUCTURES));

const nonEmptyEnergyContainersCache = cacheForRoom(
  room =>
    room
      .find(FIND_STRUCTURES)
      .filter(isEnergyStorageAnd())
      .map(s => s.id) as Id<StructureContainer | StructureStorage>[]
);
export const nonEmptyEnergyContainers = (room: Room, time: number): (StructureContainer | StructureStorage)[] =>
  nonEmptyEnergyContainersCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as (StructureContainer | StructureStorage)[];

const freeEnergyContainersCache = cacheForRoom(room =>
  _.filter<StructureContainer | StructureStorage | StructureExtension | StructureSpawn>(
    room.find(FIND_STRUCTURES),
    isEnergyContainerAnd(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
  ).map(s => s.id)
);
export const freeEnergyContainers = (
  room: Room,
  time: number
): (StructureContainer | StructureStorage | StructureExtension | StructureSpawn)[] =>
  freeEnergyContainersCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as (StructureContainer | StructureStorage | StructureExtension | StructureSpawn)[];

export const structuresToRepair = cacheForRoom(room =>
  room
    .find(FIND_STRUCTURES)
    .filter(
      s =>
        (s.structureType !== "constructedWall" && s.structureType !== "rampart" && s.hitsMax / 2 > s.hits) ||
        s.hits / 100 > s.hits
    )
);

export const structuresToRepairByTower = cacheForRoom(room =>
  _.sortBy(
    room
      .find(FIND_STRUCTURES)
      .filter(
        s =>
          s.hits < s.hitsMax &&
          (s.room.memory.wallRepairs || (s.structureType !== "constructedWall" && s.structureType !== "rampart"))
      ),
    s => repairPriority[s.structureType] * 1000 - (s.hitsMax - s.hits) / s.hitsMax
  )
);

const repairPriority = {
  spawn: 0,
  extension: 10,
  road: 15,
  container: 15,
  tower: 20,

  storage: 25,
  link: 25,
  constructedWall: 25,

  rampart: 30,

  observer: 50,
  powerSpawn: 50,
  extractor: 50,
  lab: 50,
  terminal: 50,
  nuker: 50,
  factory: 50,

  invaderCore: 999,
  keeperLair: 999,
  controller: 999,
  powerBank: 999,
  portal: 999
};

const constructionSitesCache = cacheForRoom(room => room.find(FIND_MY_CONSTRUCTION_SITES).map(s => s.id));
export const constructionSites = (room: Room, time: number): ConstructionSite[] =>
  constructionSitesCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as ConstructionSite[];

const mySpawnsCache = cacheForRoom(room => room.find(FIND_MY_SPAWNS).map(s => s.id));
export const mySpawns = (room: Room, time: number): StructureSpawn[] =>
  mySpawnsCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as StructureSpawn[];

const myTowersCache = cacheForRoom(room =>
  room
    .find<FIND_MY_STRUCTURES, StructureTower>(FIND_MY_STRUCTURES)
    .filter(
      structure => structure.structureType === STRUCTURE_TOWER && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
    )
    .map(t => t.id)
);
export const myTowers = (room: Room, time: number): StructureTower[] =>
  myTowersCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(t => t != null) as StructureTower[];

export const extensionsToSpawnFrom = cacheForRoom(room => {
  const spawns = mySpawns(room, 50).map(s => s.pos);
  return _.sortBy(
    room.find(FIND_MY_STRUCTURES).filter(s => s.structureType === "extension" || s.structureType === "spawn"),
    s => _.sum(spawns, spawn => spawn.getRangeTo(s))
  ).map(s => s.id);
});

function isEnergyContainerAnd(
  predicate: (s: StructureContainer | StructureExtension | StructureStorage | StructureSpawn) => boolean
): (s: AnyStructure) => boolean {
  return (s: AnyStructure) =>
    (((s.structureType === "extension" || s.structureType === "spawn" || s.structureType === "storage") && s.my) ||
      s.structureType === "container") &&
    predicate(s);
}

function isEnergyStorageAnd(
  predicate?: (s: StructureStorage | StructureContainer) => boolean
): (s: AnyStructure) => boolean {
  return (s: AnyStructure) =>
    ((s.structureType === "storage" && s.my) || s.structureType === "container") && (predicate ? predicate(s) : true);
}
