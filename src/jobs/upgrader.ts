import { energyContainerNotEmpty, getByIdOrNew, moveTo, tryDoOrMove } from 'utils/creep-utils';

import { CreepRoleMemory, stateChanger } from '../utils/creep-role-memory';

export interface Upgrader extends Creep {
  memory: UpgraderMemory;
}

export interface UpgraderMemory extends CreepRoleMemory {
  role: 'upgrader';

  sourcePoint?: Id<StructureStorage> | Id<StructureContainer> | Id<StructureSpawn>;


  state: 'upgrading' | 'sourcing';
}

export const upgraderBody = (energyAvailable: number) => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  if (energy < 50) return [];
  body.push(MOVE);
  energy -= 50;
  while (true) {
    if (energy < 50) break;
    body.push(CARRY);
    energy -= 50;
    if (energy < 100) break;
    body.push(WORK);
    energy -= 100;
  }
  return body;
};

export const upgraderMemory: UpgraderMemory = {
  newCreep: true,
  role: 'upgrader',
  sourcePoint: undefined,
  state: 'sourcing'
};

export function upgraderBehavior(creep: Creep): void {
  const upgrader = creep as Upgrader;
  const creepMemory = upgrader.memory;
  switch (creepMemory.state) {

    case 'sourcing':
      const source = getByIdOrNew(creepMemory.sourcePoint, energyContainerNotEmpty(upgrader));
      if (!source) break;
      creepMemory.sourcePoint = source.id;
      tryDoOrMove(() => upgrader.withdraw(source, RESOURCE_ENERGY), moveTo(upgrader, source));
      if (upgrader.store.getUsedCapacity(RESOURCE_ENERGY) >= upgrader.store.getCapacity()) {
        changeState('upgrading', upgrader);
      }
      break;

    case 'upgrading':
      const controller = upgrader.room.controller;;
      if (!controller) break;
      tryDoOrMove(() => upgrader.upgradeController(controller), moveTo(upgrader, controller));
      if (upgrader.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
        changeState('sourcing', upgrader);
      }
      break;

  }
}

const changeState = stateChanger<UpgraderMemory>('sourcePoint');
