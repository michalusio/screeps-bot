import { energyContainerNotEmpty, fillBody, getByIdOrNew, tryDoOrMove } from "utils/creeps";

import { CreepRoleMemory, stateChanger } from "../utils/creeps/role-memory";

export interface TowerBro extends Creep {
  memory: TowerBroMemory;
}

export interface TowerBroMemory extends CreepRoleMemory {
  role: "towerbro";

  storagePoint?: Id<StructureStorage | StructureSpawn | StructureContainer | StructureExtension>;

  towerPoint?: Id<StructureTower>;

  state: "getting" | "storing";
}

export const towerbroBody = fillBody.bind(undefined, 8, [MOVE, CARRY]);

export const towerbroMemory: TowerBroMemory = {
  newCreep: true,
  role: "towerbro",
  storagePoint: undefined,
  towerPoint: undefined,
  state: "getting"
};

export function towerbroBehavior(creep: Creep): void {
  const towerbro = creep as TowerBro;
  const creepMemory = towerbro.memory;
  switch (creepMemory.state) {
    case "getting":
      {
        const resource = getByIdOrNew(creepMemory.storagePoint, energyContainerNotEmpty(towerbro));
        if (!resource) {
          changeState("getting", towerbro);
          if (Game.time % 3 === 0) towerbro.wander();
          break;
        }
        creepMemory.storagePoint = resource.id;
        tryDoOrMove(() => towerbro.withdraw(resource, RESOURCE_ENERGY), towerbro.travelTo(resource));
        if (towerbro.store.getUsedCapacity(RESOURCE_ENERGY) >= towerbro.store.getCapacity()) {
          changeState("storing", towerbro);
        }
      }
      break;

    case "storing":
      {
        const towers = towerbro.room
          .find<FIND_MY_STRUCTURES, StructureTower>(FIND_MY_STRUCTURES)
          .filter(
            (s: AnyStructure) => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          );
        const tower = getByIdOrNew(creepMemory.towerPoint, () =>
          minBy(towers, t => t.store.getUsedCapacity(RESOURCE_ENERGY))
        );
        if (!tower) break;
        creepMemory.towerPoint = tower.id;
        const transferCode = tryDoOrMove(() => towerbro.transfer(tower, RESOURCE_ENERGY), towerbro.travelTo(tower));
        if (transferCode === ERR_FULL) {
          changeState("storing", towerbro);
        } else if (towerbro.store.getUsedCapacity(RESOURCE_ENERGY) <= 1) {
          changeState("getting", towerbro);
        }
      }
      break;
  }
}

const changeState = stateChanger<TowerBroMemory>("storagePoint", "towerPoint");
