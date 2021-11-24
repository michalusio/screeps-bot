import { REPAIR_PRIORITY, STORAGE_QUOTAS } from "configs";
import { cacheForRoom } from "./cache-util";
import { sources, sourcesAndMineral } from "./source-cache";

export const structures = cacheForRoom("structures", room => room.find(FIND_STRUCTURES));

export const sourceContainers = cacheForRoom("source containers", room => {
  const sourceList = sourcesAndMineral(room, 1000);
  return structures(room, 10)
    .filter(s => s.structureType === STRUCTURE_CONTAINER)
    .filter(s => sourceList.some(source => s.pos.isNearTo(source))) as StructureContainer[];
});

const towersSpawnContainersCache = cacheForRoom("towers/spawns/extensions", room =>
  room
    .find<FIND_MY_STRUCTURES, StructureTower | StructureSpawn | StructureExtension>(FIND_MY_STRUCTURES)
    .filter(
      (s: AnyStructure) =>
        (s.structureType === STRUCTURE_TOWER ||
          s.structureType === STRUCTURE_SPAWN ||
          s.structureType === STRUCTURE_EXTENSION) &&
        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    )
    .map(s => s.id)
);
export const towersSpawnContainers = (
  room: Room,
  time: number
): (StructureTower | StructureSpawn | StructureExtension)[] =>
  towersSpawnContainersCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as (StructureTower | StructureSpawn | StructureExtension)[];

const energyStoragesCache = cacheForRoom(
  "energy storages",
  room =>
    room
      .find(FIND_STRUCTURES)
      .filter(isEnergyStorage)
      .map(s => s.id) as Id<StructureContainer | StructureStorage>[]
);
export const energyStorages = (room: Room): (StructureContainer | StructureStorage)[] =>
  energyStoragesCache(room, 100)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as (StructureContainer | StructureStorage)[];

export const energyStoragesWithoutSourcedCache = cacheForRoom("energy storages without sourced", room => {
  const sourceList = sources(room, 1000);
  return energyStorages(room).filter(s => sourceList.every(source => !s.pos.isNearTo(source)));
});

const freeEnergyContainersCache = cacheForRoom("free energy containers", room =>
  _.filter<StructureContainer | StructureStorage | StructureExtension | StructureSpawn>(
    room.find(FIND_STRUCTURES),
    isEnergyContainerAnd(s =>
      s.structureType === "spawn"
        ? s.store.getFreeCapacity(RESOURCE_ENERGY) > 30
        : s.structureType === "storage"
        ? s.store.getUsedCapacity(RESOURCE_ENERGY) < STORAGE_QUOTAS[RESOURCE_ENERGY]
        : sourcesAndMineral(room, 5).every(sm => !sm.pos.isNearTo(s.pos)) &&
          s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    )
  ).map(s => s.id)
);
export const freeEnergyContainers = (
  room: Room,
  time: number
): (StructureContainer | StructureStorage | StructureExtension | StructureSpawn)[] =>
  freeEnergyContainersCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as (StructureContainer | StructureStorage | StructureExtension | StructureSpawn)[];

export const structuresToRepair = cacheForRoom("structures to repair", room =>
  room
    .find(FIND_STRUCTURES)
    .filter(s => s.hits < s.hitsMax)
    .filter(
      s => (s.structureType !== "rampart" && s.structureType !== "constructedWall") || s.hits < room.memory.wallRepairs
    )
);

export const structuresToRepairByTower = cacheForRoom("structures to repair by tower", room =>
  _.sortBy(
    room
      .find(FIND_STRUCTURES)
      .filter(s => s.hits < s.hitsMax)
      .filter(
        s =>
          (s.structureType !== "rampart" && s.structureType !== "constructedWall") || s.hits < room.memory.wallRepairs
      ),
    s => (REPAIR_PRIORITY[s.structureType] || 15) * 10 + s.hits / s.hitsMax
  )
);

const constructionSitesCache = cacheForRoom("construction sites", room =>
  room.find(FIND_MY_CONSTRUCTION_SITES).map(s => s.id)
);
export const constructionSites = (room: Room, time: number): ConstructionSite[] =>
  constructionSitesCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as ConstructionSite[];

export const anyConstructionSitesIncludingRemotes = (room: Room): boolean => {
  return (
    constructionSites(room, 5).length > 0 ||
    Memory.rooms[room.name].remotes.some(
      remote => Game.rooms[remote] && constructionSites(Game.rooms[remote], 5).length > 0
    )
  );
};

const hostileSpawnsCache = cacheForRoom("hostile spawns", room => room.find(FIND_HOSTILE_SPAWNS).map(s => s.id));
export const hostileSpawns = (room: Room, time: number): StructureSpawn[] =>
  hostileSpawnsCache(room, time)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as StructureSpawn[];

const mySpawnsCache = cacheForRoom("my spawns", room => room.find(FIND_MY_SPAWNS).map(s => s.id));
export const mySpawns = (room: Room): StructureSpawn[] =>
  mySpawnsCache(room, 200)
    .map(id => Game.getObjectById(id))
    .filter(s => s != null) as StructureSpawn[];

const myTowersCache = cacheForRoom("my towers", room =>
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

export const extensionsToSpawnFrom = cacheForRoom("extensions for spawning", room => {
  const spawns = mySpawns(room).map(s => s.pos);
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

function isEnergyStorage(s: AnyStructure) {
  return (s.structureType === "storage" && s.my) || s.structureType === "container";
}
