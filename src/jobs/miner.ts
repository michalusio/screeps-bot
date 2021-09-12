import { energyContainerNotFull, getByIdOrNew, moveTo, tryDoOrMove } from 'utils/creep-utils';

import { CreepRoleMemory } from '../utils/creep-role-memory';

const energyMargin = 2;

export interface Miner extends Creep {
  memory: MinerMemory;
}

export interface MinerMemory extends CreepRoleMemory {
  role: 'miner';

  sourcePoint?: Id<Source>;

  transferPoint?: Id<StructureContainer> | Id<StructureSpawn> | Id<StructureExtension>;

  state: 'mining' | 'transfering';
}

export const minerBody = (energyAvailable: number) => {
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

export const minerMemory: MinerMemory = {
  newCreep: true,
  role: 'miner',
  sourcePoint: undefined,
  transferPoint: undefined,
  state: 'mining'
};

export function minerBehavior(creep: Creep): void {
  const miner = creep as Miner;
  const creepMemory = miner.memory;
  switch (creepMemory.state) {

    case 'mining':
      const source = getByIdOrNew(creepMemory.sourcePoint, () => _.sample(miner.room.find(FIND_SOURCES_ACTIVE)));
      if (!source) break;
      creepMemory.sourcePoint = source.id;
      tryDoOrMove(() => miner.harvest(source), moveTo(miner, source));
      if (miner.store.getUsedCapacity(RESOURCE_ENERGY) + energyMargin >= miner.store.getCapacity()) {
        creepMemory.state = 'transfering';
        creepMemory.transferPoint = undefined;
      }
      break;

    case 'transfering':
      const transfer = getByIdOrNew(creepMemory.transferPoint, energyContainerNotFull(miner.room));
      if (!transfer) break;
      creepMemory.transferPoint = transfer.id;
      const transferCode = tryDoOrMove(() => miner.transfer(transfer, RESOURCE_ENERGY), moveTo(miner, transfer));
      if (transferCode === ERR_FULL) {
        creepMemory.transferPoint = undefined;
      }
      if (miner.store.getUsedCapacity(RESOURCE_ENERGY) <= energyMargin) {
        creepMemory.state = 'mining';
        creepMemory.sourcePoint = undefined;
      }
      break;

  }
}
