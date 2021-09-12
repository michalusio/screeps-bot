import { freeSpaceAround, getByIdOrNew, moveTo, tryDoOrMove } from 'utils/creep-utils';

import { CreepRoleMemory } from '../utils/creep-role-memory';

export interface Miner extends Creep {
  memory: MinerMemory;
}

export interface MinerMemory extends CreepRoleMemory {
  role: 'miner';

  sourcePoint?: Id<Source>;

  state: 'mining';
}

export const minerBody = (energyAvailable: number) => {
  if (energyAvailable < BODYPART_COST[MOVE]) return [];
  const body: BodyPartConstant[] = [MOVE];
  let energy = energyAvailable - BODYPART_COST[MOVE];
  while (energy >= 100) {
    body.push(WORK);
    energy -= 100;
  }
  return body;
};

export const minerMemory: MinerMemory = {
  newCreep: true,
  role: 'miner',
  sourcePoint: undefined,
  state: 'mining'
};

export function minerBehavior(creep: Creep): void {
  const miner = creep as Miner;
  const creepMemory = miner.memory;
  switch (creepMemory.state) {

    case 'mining':
      if (miner.store.energy > 0) miner.drop(RESOURCE_ENERGY);
      const source = getByIdOrNew(creepMemory.sourcePoint, () => _.sample(miner.room.find(FIND_SOURCES_ACTIVE)));
      if (!source) break;
      if (freeSpaceAround(source.pos, source.room) === 0) {
        creepMemory.sourcePoint = undefined;
        break;
      }
      creepMemory.sourcePoint = source.id;
      tryDoOrMove(() => miner.harvest(source), moveTo(miner, source));
      break;

  }
}
