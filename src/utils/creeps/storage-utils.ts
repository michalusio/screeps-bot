import { mySpawns } from "cache/structure-cache";

const fillPriority = {
  spawn: 1,
  extension: 2,
  storage: 3,
  container: 4
};

const emptyPriority = {
  spawn: 4,
  extension: 3,
  storage: 2,
  container: 2
};

const notEmptyContainerCache: {
  value: [(StructureContainer | StructureStorage)[], (StructureContainer | StructureStorage)[]];
  time: number;
} = { value: [[], []], time: 0 };

export function energyContainerNotEmpty(
  creep: Creep
): () => StructureContainer | StructureStorage | StructureSpawn | undefined {
  return () => {
    if (notEmptyContainerCache.time !== Game.time) {
      notEmptyContainerCache.value[0] = creep.room.find(FIND_STRUCTURES).filter(isEnergyStorageAnd()) as (
        | StructureContainer
        | StructureStorage
      )[];
      notEmptyContainerCache.value[1] = notEmptyContainerCache.value[0].filter(
        s => s.store.getUsedCapacity(RESOURCE_ENERGY) > 200
      );
      notEmptyContainerCache.time = Game.time;
    }
    const filtered = notEmptyContainerCache.value[0];
    const withEnergy = notEmptyContainerCache.value[1];
    return (
      _.min(withEnergy, emptyByStructureTypeThenRange(creep)) ??
      (filtered.length === 0
        ? _.sample(mySpawns(creep.room, 50).filter(s => s.store.getUsedCapacity(RESOURCE_ENERGY) > 200))
        : undefined)
    );
  };
}

const notFullContainerCache: {
  value: (StructureContainer | StructureStorage | StructureExtension | StructureSpawn)[];
  time: number;
} = { value: [], time: 0 };

export function energyContainerNotFull(
  creep: Creep
): () => StructureStorage | StructureContainer | StructureExtension | StructureSpawn | undefined {
  return () => {
    if (notFullContainerCache.time !== Game.time) {
      notFullContainerCache.value = _.filter<
        StructureContainer | StructureStorage | StructureExtension | StructureSpawn
      >(
        creep.room.find(FIND_STRUCTURES),
        isEnergyContainerAnd(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
      );
      notFullContainerCache.time = Game.time;
    }
    return _.min(notFullContainerCache.value, fillByStructureTypeThenRange(creep));
  };
}

function fillByStructureTypeThenRange(
  creep: Creep
): (s: StructureContainer | StructureStorage | StructureExtension | StructureSpawn) => number {
  return s => fillPriority[s.structureType] * 10000 + s.pos.getRangeTo(creep.pos);
}

function emptyByStructureTypeThenRange(
  creep: Creep
): (s: StructureContainer | StructureStorage | StructureExtension | StructureSpawn) => number {
  return s => emptyPriority[s.structureType] * 10000 + s.pos.getRangeTo(creep.pos);
}

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
