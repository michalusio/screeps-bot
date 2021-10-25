import { sourcesAndMineral } from "cache/source-cache";
import { sourceContainers } from "cache/structure-cache";
import { fillBody, getByIdOrNew, tryDoOrMove } from "utils/creeps";

import { CreepRoleMemory } from "../utils/creeps/role-memory";

export interface Miner extends Creep {
  memory: MinerMemory;
}

export interface MinerMemory extends CreepRoleMemory {
  role: "miner";

  sourcePoint?: Id<Source | Mineral>;
  dismantlePoint?: Id<Structure>;

  state: "mining" | "dismantling";
}

export const minerBody = fillBody.bind(undefined, 7, [WORK, MOVE, WORK, WORK, MOVE, WORK, WORK]);

export const minerMemory: MinerMemory = {
  newCreep: true,
  role: "miner",
  sourcePoint: undefined,
  dismantlePoint: undefined,
  state: "mining"
};

export function minerBehavior(creep: Creep): void {
  const miner = creep as Miner;
  const creepMemory = miner.memory;
  if (creepMemory.dismantlePoint) {
    creepMemory.state = "dismantling";
  }
  switch (creepMemory.state) {
    case "dismantling":
      {
        if (!creepMemory.dismantlePoint) {
          creepMemory.state = "mining";
          return;
        }
        const dismantleStruct = Game.getObjectById(creepMemory.dismantlePoint);
        if (!dismantleStruct) {
          creepMemory.dismantlePoint = undefined;
          creepMemory.state = "mining";
          return;
        }
        tryDoOrMove(
          () => miner.dismantle(dismantleStruct),
          miner.travelTo(dismantleStruct, undefined, { ignoreCreeps: true })
        );
      }
      break;
    case "mining":
      {
        const source = getByIdOrNew(
          creepMemory.sourcePoint,
          () =>
            sourcesAndMineral(creep.room, 1000).filter(
              s =>
                (s instanceof Source ||
                  s.pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_EXTRACTOR)) &&
                _.every(
                  Game.creeps,
                  c => c.roleMemory.role !== "miner" || (c.memory as MinerMemory).sourcePoint !== s.id
                )
            )[0]
        );
        if (!source) {
          if (Game.time % 3 === 0) {
            creep.wander();
          }
          break;
        } else {
          creepMemory.sourcePoint = source.id;
          const sourceContainer = sourceContainers(miner.room, 10).filter(c => c.pos.isNearTo(source))[0];
          if (sourceContainer) {
            tryDoOrMove(
              () => miner.harvest(source),
              () =>
                miner.travelInto(sourceContainer, undefined, {
                  ignoreCreeps: true,
                  visualizePathStyle: { stroke: "#ff0000" }
                })
            );
          } else tryDoOrMove(() => miner.harvest(source), miner.travelTo(source, undefined, { ignoreCreeps: true }));
        }
      }
      break;
  }
}
