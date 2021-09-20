import { energyContainerNotFull, getByIdOrNew, moveTo, tryDoOrMove } from 'utils/creeps';

import { CreepRoleMemory, stateChanger } from '../utils/creeps/role-memory';

export interface Hauler extends Creep {
  memory: HaulerMemory;
}

export interface HaulerMemory extends CreepRoleMemory {
  role: 'hauler';

  energyPoint?: Id<Resource>;

  storagePoint?: Id<StructureStorage | StructureSpawn | StructureContainer | StructureExtension>;

  state: 'getting' | 'storing';
}

export const haulerBody = (energyAvailable: number) => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  while (energy > 50 && body.length < 50) {
    if (energy < 50 || body.length === 50) break;
    body.push(MOVE);
    energy -= 50;
    if (energy < 50 || body.length === 50) break;
    body.push(CARRY);
    energy -= 50;
    if (energy < 50 || body.length === 50) break;
    body.push(CARRY);
    energy -= 50;
  }
  return body;
};

export const haulerMemory: HaulerMemory = {
  newCreep: true,
  role: 'hauler',
  energyPoint: undefined,
  storagePoint: undefined,
  state: 'getting'
};

const resourceCache: { [room: string]: [Resource<'energy'>[], number] } = {};

const avoidSources = (room: Room): RoomPosition[] => room.find(FIND_SOURCES).flatMap(s => s.pos.getAround(1));
const findNewResource = (hauler: Hauler) => () => {
  resourceCache[hauler.room.name] = (resourceCache[hauler.room.name] ?? [[], 0])[1] === Game.time
    ? resourceCache[hauler.room.name]
    : [hauler.room.find(FIND_DROPPED_RESOURCES, { filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 10 }), Game.time];
  return _.find(
    _.sortBy(
      resourceCache[hauler.room.name][0],
      r => -r.pos.getRangeTo(hauler.pos) * 10 - r.amount
    ),
    r => r.pos.getFreeSpaceAround() > 0 || r.pos.isNearTo(hauler)
  );
};

export function haulerBehavior(creep: Creep): void {
  const hauler = creep as Hauler;
  const creepMemory = hauler.memory;
  switch (creepMemory.state) {

    case 'getting':
      const resource = getByIdOrNew(creepMemory.energyPoint, findNewResource(hauler));
      if (!resource) break;
      creepMemory.energyPoint = resource.id;
      tryDoOrMove(() => hauler.pickup(resource), moveTo(hauler, resource, avoidSources));
      if (hauler.store.getUsedCapacity(RESOURCE_ENERGY) >= hauler.store.getCapacity()) {
        changeState('storing', hauler);
      }
      break;

    case 'storing':
      const storage = getByIdOrNew(creepMemory.storagePoint, energyContainerNotFull(hauler));
      if (!storage) break;
      if (!storage.store || storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        changeState('storing', hauler);
        break;
      }
      creepMemory.storagePoint = storage.id;
      const transferCode = tryDoOrMove(() => hauler.transfer(storage, RESOURCE_ENERGY), moveTo(hauler, storage, avoidSources));
      if (transferCode === ERR_FULL) {
        changeState('storing', hauler);
      }
      else if (hauler.store.getUsedCapacity(RESOURCE_ENERGY) <= 1) {
        changeState('getting', hauler);
      }
      break;

  }
}

const changeState = stateChanger<HaulerMemory>('energyPoint', 'storagePoint');
