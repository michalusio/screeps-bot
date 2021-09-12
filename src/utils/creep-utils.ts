export type MoveToReturnCode = CreepMoveReturnCode | -2 | -5 | -7;

export function getByIdOrNew<T>(id: Id<T> | undefined, getNew: () => T | undefined): T | undefined {
  return (id ? Game.getObjectById(id) : undefined) || getNew();
}

export function tryDoOrMove(doAction: () => ScreepsReturnCode, doMove: () => MoveToReturnCode): ScreepsReturnCode {
  const doCode = doAction();
  if (doCode === ERR_NOT_IN_RANGE) {
    return doMove();
  }
  return doCode;
}

export function moveTo(creep: Creep, target: RoomPosition | { pos: RoomPosition }): () => MoveToReturnCode {
  return () => creep.moveTo(target, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' } });
}

export function structuresToRepair(room: Room): AnyStructure[] {
  return room.find(FIND_STRUCTURES, { filter: (s) => s.hitsMax/2 > s.hits });
}

export function energyContainerNotEmpty(room: Room): () => StructureContainer | StructureStorage | undefined {
  return () => _.sample(_.sortBy(_.filter<StructureContainer | StructureStorage>(room.find(FIND_STRUCTURES),
  isEnergyStorageAnd(s => s.store.getUsedCapacity(RESOURCE_ENERGY) > 200)
), s => s.structureType));
}

export function energyContainerNotFull(room: Room): () => StructureContainer | StructureExtension | StructureSpawn | undefined {
  return () => _.sample(_.sortBy(_.filter<StructureContainer | StructureExtension | StructureSpawn>(room.find(FIND_STRUCTURES),
  isEnergyContainerAnd(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
), s => s.structureType));
}

function isEnergyContainerAnd(predicate: (s: StructureContainer | StructureExtension | StructureStorage | StructureSpawn) => boolean): (s: StructureContainer | StructureExtension | StructureStorage | StructureSpawn) => boolean {
  return (s: StructureContainer | StructureExtension | StructureStorage | StructureSpawn) =>
    (((s.structureType === 'extension' || s.structureType === 'spawn' || s.structureType === 'storage') && s.my) || s.structureType === 'container')
    && predicate(s);
}

function isEnergyStorageAnd(predicate: (s: StructureStorage | StructureContainer) => boolean): (s: StructureStorage | StructureContainer) => boolean {
  return (s: StructureStorage | StructureContainer) =>
    ((s.structureType === 'storage' && s.my) || s.structureType === 'container')
    && predicate(s);
}
