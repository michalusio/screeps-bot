import {
  freeEnergyContainers,
  mySpawns,
  energyStorages,
  energyStoragesWithoutSourcedCache
} from "cache/structure-cache";
import { EMPTY_PRIORITY, FILL_PRIORITY } from "configs";

type PerRoomNotEmptyContainerCache = {
  value: [(StructureContainer | StructureStorage)[], (StructureContainer | StructureStorage)[]];
  time: number;
};

const notEmptyContainerCache: { [room: string]: PerRoomNotEmptyContainerCache } = {};

export function energyContainerNotEmpty(
  creep: Creep,
  omitSourceContainers = false
): () => StructureContainer | StructureStorage | StructureSpawn | undefined {
  return () => {
    if (!notEmptyContainerCache[creep.room.name]) {
      notEmptyContainerCache[creep.room.name] = { value: [[], []], time: 0 };
    }
    const notEmptyCache = notEmptyContainerCache[creep.room.name];
    if (notEmptyCache.time !== Game.time) {
      notEmptyCache.value[0] = omitSourceContainers
        ? energyStoragesWithoutSourcedCache(creep.room, 100)
        : energyStorages(creep.room);
      notEmptyCache.value[1] = notEmptyCache.value[0].filter(s => s.store.getUsedCapacity(RESOURCE_ENERGY) > 200);
      notEmptyCache.time = Game.time;
    }
    const filtered = notEmptyCache.value[0];
    const withEnergy = notEmptyCache.value[1];
    return (
      minBy(withEnergy, emptyByStructureTypeThenRange(creep)) ??
      (filtered.length === 0
        ? _.sample(mySpawns(creep.room).filter(s => s.store.getUsedCapacity(RESOURCE_ENERGY) > 200))
        : undefined)
    );
  };
}

type PerRoomNotFullContainerCache = {
  value: (StructureContainer | StructureStorage | StructureExtension | StructureSpawn)[];
  time: number;
};

const notFullContainerCache: { [room: string]: PerRoomNotFullContainerCache } = {};

export function energyContainerNotFull(
  creep: Creep
): () => StructureStorage | StructureContainer | StructureExtension | StructureSpawn | undefined {
  return () => {
    if (!notFullContainerCache[creep.room.name]) {
      notFullContainerCache[creep.room.name] = { value: [], time: 0 };
    }
    const notFullCache = notFullContainerCache[creep.room.name];
    if (notFullCache.time !== Game.time) {
      notFullCache.value = freeEnergyContainers(creep.room, 0);
      notFullCache.time = Game.time;
    }
    return minBy(notFullCache.value, fillByStructureTypeThenRange(creep));
  };
}

function fillByStructureTypeThenRange(
  creep: Creep
): (s: StructureContainer | StructureStorage | StructureExtension | StructureSpawn) => number {
  return s => FILL_PRIORITY[s.structureType] * 10000 + s.pos.getRangeTo(creep.pos);
}

function emptyByStructureTypeThenRange(
  creep: Creep
): (s: StructureContainer | StructureStorage | StructureExtension | StructureSpawn) => number {
  return s => EMPTY_PRIORITY[s.structureType] * 10000 + s.pos.getRangeTo(creep.pos);
}
