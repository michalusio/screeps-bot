import { energyContainerNotFull, getByIdOrNew, moveTo, tryDoOrMove } from 'utils/creep-utils';

import { CreepRoleMemory } from '../utils/creep-role-memory';

export interface Hauler extends Creep {
  memory: HaulerMemory;
}

export interface HaulerMemory extends CreepRoleMemory {
  role: 'hauler';

  energyPoint?: Id<Resource>;

  storagePoint?: Id<StructureSpawn> | Id<StructureContainer> | Id<StructureExtension>;

  state: 'getting-energy' | 'moving to storage';
}

export const haulerBody = (energyAvailable: number) => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  while (energy >= 100) {
    body.push(CARRY);
    body.push(MOVE);
    energy -= 100;
  }
  return body;
};

export const haulerMemory: HaulerMemory = {
  newCreep: true,
  role: 'hauler',
  energyPoint: undefined,
  storagePoint: undefined,
  state: 'getting-energy'
};

export function haulerBehavior(creep: Creep): void {
  const hauler = creep as Hauler;
  const creepMemory = hauler.memory;
  switch (creepMemory.state) {

    case 'getting-energy':
      const resource = getByIdOrNew(creepMemory.energyPoint, () => hauler.pos.findClosestByRange(FIND_DROPPED_RESOURCES, { filter: r => r.resourceType === RESOURCE_ENERGY }));
      if (!resource) break;
      creepMemory.energyPoint = resource.id;
      tryDoOrMove(() => hauler.pickup(resource), moveTo(hauler, resource));
      if (hauler.store.getUsedCapacity(RESOURCE_ENERGY) >= hauler.store.getCapacity()) {
        creepMemory.state = 'moving to storage';
      }
      break;

    case 'moving to storage':
      const storage = getByIdOrNew(creepMemory.storagePoint, energyContainerNotFull(hauler.room));
      if (!storage) break;
      creepMemory.storagePoint = storage.id;
      const transferCode = tryDoOrMove(() => hauler.transfer(storage, RESOURCE_ENERGY), moveTo(hauler, storage));
      if (transferCode === ERR_FULL) {
        creepMemory.storagePoint = undefined;
      }
      if (hauler.store.getUsedCapacity(RESOURCE_ENERGY) <= 1) {
        creepMemory.state = 'getting-energy';
        creepMemory.energyPoint = undefined;
      }
      break;

  }
}
