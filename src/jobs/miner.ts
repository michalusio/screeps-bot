import { sources } from "cache/source-cache";
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

export const minerBody = fillBody.bind(undefined, 8, [MOVE, WORK, WORK, WORK]);

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
        const source = getByIdOrNew(
          creepMemory.sourcePoint,
          () =>
            sources(creep.room, 1000).filter(s =>
              _.every(Game.creeps, c => c.roleMemory.role !== "miner" || (c.memory as MinerMemory).sourcePoint !== s.id)
            )[0]
        );
        if (!source) {
          if (Game.time % 3 === 0) {
            creep.wander();
          }
          break;
        } else {
          creepMemory.sourcePoint = source.id;
          tryDoOrMove(() => miner.harvest(source), miner.travelTo(source));
        }
      }
      break;
  }
}
