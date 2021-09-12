import { energyContainerNotEmpty, getByIdOrNew, moveTo, tryDoOrMove } from 'utils/creep-utils';

import { CreepRoleMemory } from '../utils/creep-role-memory';

export interface Upgrader extends Creep {
  memory: UpgraderMemory;
}

export interface UpgraderMemory extends CreepRoleMemory {
  role: 'upgrader';

  sourcePoint?: Id<StructureStorage> | Id<StructureContainer>;

  upgradePoint?: Id<StructureController>;

  state: 'upgrading' | 'sourcing';
}

export const upgraderBody = (energyAvailable: number) => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  while (energy >= 200) {
    body.push(WORK);
    body.push(CARRY);
    body.push(MOVE);
    energy -= 200;
  }
  return body;
};

export const upgraderMemory: UpgraderMemory = {
  newCreep: true,
  role: 'upgrader',
  sourcePoint: undefined,
  upgradePoint: undefined,
  state: 'sourcing'
};

export function upgraderBehavior(creep: Creep): void {
  const upgrader = creep as Upgrader;
  const creepMemory = upgrader.memory;
  switch (creepMemory.state) {

    case 'sourcing':
      const source = getByIdOrNew(creepMemory.sourcePoint, energyContainerNotEmpty(upgrader.room));
      if (!source) break;
      creepMemory.sourcePoint = source.id;
      tryDoOrMove(() => upgrader.withdraw(source, RESOURCE_ENERGY), moveTo(upgrader, source));
      if (upgrader.store.getUsedCapacity(RESOURCE_ENERGY) >= upgrader.store.getCapacity()) {
        creepMemory.state = 'upgrading';
      }
      break;

    case 'upgrading':
      const controller = upgrader.room.controller;;
      if (!controller) break;
      creepMemory.upgradePoint = controller.id;
      tryDoOrMove(() => upgrader.upgradeController(controller), moveTo(upgrader, controller));
      if (upgrader.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
        creepMemory.state = 'sourcing';
      }
      break;

  }
}
