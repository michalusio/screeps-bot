import { getByIdOrNew, moveTo, tryDoOrMove } from 'utils/creeps';

import { CreepRoleMemory } from '../utils/creeps/role-memory';

export interface Miner extends Creep {
  memory: MinerMemory;
}

export interface MinerMemory extends CreepRoleMemory {
  role: 'miner';

  sourcePoint?: Id<Source>;

  state: 'mining';
}

export const minerBody = (energyAvailable: number) => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  while (body.length < 12) {
    if (energy < 50) break;
    body.push(MOVE);
    energy -= 50;
    if (energy < 100) break;
    body.push(WORK);
    energy -= 100;
    if (energy < 100) break;
    body.push(WORK);
    energy -= 100;
    if (energy < 100) break;
    body.push(WORK);
    energy -= 100;
    if (energy < 100) break;
    body.push(WORK);
    energy -= 100;
    if (energy < 100) break;
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
      const source = getByIdOrNew(creepMemory.sourcePoint, () => _.sample(miner.room.find(FIND_SOURCES_ACTIVE)));
      if (!source || source.energy === 0) {
        const newSource = _.min(miner.room.find(FIND_SOURCES), s => s.ticksToRegeneration);
        creepMemory.sourcePoint = undefined;
        moveTo(miner, newSource)();
      } else {
        if (source.pos.getRangeTo(miner.pos) > 1.8 && source.pos.getFreeSpaceAround() === 0) {
          creepMemory.sourcePoint = undefined;
          break;
        }
        creepMemory.sourcePoint = source.id;
        tryDoOrMove(() => miner.harvest(source), moveTo(miner, source));
      }
      break;

  }
}
