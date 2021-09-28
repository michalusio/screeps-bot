import { fillBody, getByIdOrNew, tryDoOrMove } from "utils/creeps";

import { CreepRoleMemory } from "../utils/creeps/role-memory";

export interface Miner extends Creep {
  memory: MinerMemory;
}

export interface MinerMemory extends CreepRoleMemory {
  role: "miner";

  sourcePoint?: Id<Source>;

  state: "mining";
}

export const minerBody = fillBody.bind(undefined, 10, [MOVE, WORK, WORK, WORK, WORK]);

export const minerMemory: MinerMemory = {
  newCreep: true,
  role: "miner",
  sourcePoint: undefined,
  state: "mining"
};

export function minerBehavior(creep: Creep): void {
  const miner = creep as Miner;
  const creepMemory = miner.memory;
  switch (creepMemory.state) {
    case "mining":
      {
        const source = getByIdOrNew(creepMemory.sourcePoint, () =>
          _.sample(miner.room.find(FIND_SOURCES_ACTIVE).filter(s => s.pos.getFreeSpaceAround() > 0))
        );
        if (!source || source.energy === 0 || (!source.pos.isNearTo(miner) && source.pos.getFreeSpaceAround() > 0)) {
          const newSource = minBy(miner.room.find(FIND_SOURCES), s => s.ticksToRegeneration);
          if (newSource) {
            creepMemory.sourcePoint = undefined;
            miner.travelTo(newSource)();
          }
        } else {
          if (source.pos.getRangeTo(miner.pos) > 1.8 && source.pos.getFreeSpaceAround() === 0) {
            creepMemory.sourcePoint = undefined;
            break;
          }
          creepMemory.sourcePoint = source.id;
          tryDoOrMove(() => miner.harvest(source), miner.travelTo(source));
        }
      }
      break;
  }
}
