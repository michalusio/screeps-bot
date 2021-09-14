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

export function moveTo(creep: Creep, target: RoomPosition | { pos: RoomPosition }, avoid?: (room: Room) => RoomPosition[]): () => MoveToReturnCode {
  const avoided = avoid?.call(undefined, creep.room) ?? [];
  const costCallback = (name: string, matrix: CostMatrix) => avoided.filter(a => a.roomName === name).forEach(a => matrix.set(a.x, a.y, Number.MAX_VALUE));
  return () => creep.fatigue === 0 ? creep.moveTo(target, { reusePath: 5, visualizePathStyle: { stroke: '#ffaa00' }, costCallback }) : ERR_TIRED;
}

export function structuresToRepair(room: Room): AnyStructure[] {
  return room.find(FIND_STRUCTURES, { filter: (s) => s.hitsMax/2 > s.hits });
}

const fillPriority = {
  'spawn': 1,
  'extension': 2,
  'container': 3,
  'storage': 4
};

const emptyPriority = {
  'spawn': 4,
  'extension': 3,
  'container': 2,
  'storage': 1
};

export function energyContainerNotEmpty(creep: Creep): () => StructureContainer | StructureStorage | StructureSpawn | undefined {
  return () => {
    const filtered = _.filter(creep.room.find(FIND_STRUCTURES),
      isEnergyStorageAnd()
    ) as (StructureContainer | StructureStorage)[];
    const withEnergy = _.filter(filtered, s => s.store.getUsedCapacity(RESOURCE_ENERGY) > 200);
      return _.first<StructureContainer | StructureStorage>(_.sortBy(withEnergy, emptyByStructureTypeThenRange(creep))) ?? (filtered.length === 0 ? _.sample(creep.room.find(FIND_MY_SPAWNS, { filter: s => s.store.getUsedCapacity(RESOURCE_ENERGY) > 200 })) : undefined);
  };
}

export function energyContainerNotFull(creep: Creep): () => StructureStorage | StructureContainer | StructureExtension | StructureSpawn | undefined {
  return () => _.first(_.sortBy(_.filter<StructureContainer | StructureStorage | StructureExtension | StructureSpawn>(creep.room.find(FIND_STRUCTURES),
    isEnergyContainerAnd(s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
  ), fillByStructureTypeThenRange(creep)));
}

function fillByStructureTypeThenRange(creep: Creep): (s: StructureContainer | StructureStorage | StructureExtension | StructureSpawn) => number {
  return s => fillPriority[s.structureType]*10000 + s.pos.getRangeTo(creep.pos);
}

function emptyByStructureTypeThenRange(creep: Creep): (s: StructureContainer | StructureStorage | StructureExtension | StructureSpawn) => number {
  return s => emptyPriority[s.structureType]*10000 + s.pos.getRangeTo(creep.pos);
}

function isEnergyContainerAnd(predicate: (s: StructureContainer | StructureExtension | StructureStorage | StructureSpawn) => boolean): (s: AnyStructure) => boolean {
  return (s: AnyStructure) =>
    (((s.structureType === 'extension' || s.structureType === 'spawn' || s.structureType === 'storage') && s.my) || s.structureType === 'container')
    && predicate(s);
}

function isEnergyStorageAnd(predicate?: (s: StructureStorage | StructureContainer) => boolean): (s: AnyStructure) => boolean {
  return (s: AnyStructure) =>
    ((s.structureType === 'storage' && s.my) || s.structureType === 'container')
    && (predicate ? predicate(s) : true);
}

export function freeSpaceAround(pos: RoomPosition, room: Room): number {
  var fields = room.lookForAtArea(LOOK_TERRAIN, pos.y-1, pos.x-1, pos.y+1, pos.x+1, true);
  var creeps = room.lookForAtArea(LOOK_CREEPS, pos.y-1, pos.x-1, pos.y+1, pos.x+1, true);
  return 9-_.countBy( fields , f => f.terrain ).wall - creeps.length;
}
