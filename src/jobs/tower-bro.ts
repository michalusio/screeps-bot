import { towersSpawnContainers } from "cache/structure-cache";
import { energyContainerNotEmpty, fillBody, getByIdOrNew, tryDoOrMove } from "utils/creeps";

import { CreepRoleMemory, stateChanger } from "../utils/creeps/role-memory";

export interface TowerBro extends Creep {
  memory: TowerBroMemory;
}

export interface TowerBroMemory extends CreepRoleMemory {
  role: "towerbro";

  storagePoint?: Id<StructureStorage | StructureSpawn | StructureContainer | StructureExtension>;

  managePoint?: Id<StructureTower | StructureSpawn | StructureExtension>;

  state: "getting" | "storing";
}

export const towerbroBody = fillBody.bind(undefined, 8, [MOVE, CARRY]);

export const towerbroMemory: TowerBroMemory = {
  newCreep: true,
  role: "towerbro",
  storagePoint: undefined,
  managePoint: undefined,
  state: "getting"
};

export function towerbroBehavior(creep: Creep): void {
  const towerbro = creep as TowerBro;
  const creepMemory = towerbro.memory;
  switch (creepMemory.state) {
    case "getting":
      {
        const resource = getByIdOrNew(creepMemory.storagePoint, energyContainerNotEmpty(towerbro));
        if (!resource || resource.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
          changeState("getting", towerbro);
          if (Game.time % 3 === 0) towerbro.wander();
          break;
        }
        creepMemory.storagePoint = resource.id;
        tryDoOrMove(
          () => towerbro.withdraw(resource, RESOURCE_ENERGY),
          towerbro.travelTo(resource),
          towerbro,
          resource
        );
        if (towerbro.store.getUsedCapacity(RESOURCE_ENERGY) >= towerbro.store.getCapacity()) {
          changeState("storing", towerbro);
        }
      }
      break;

    case "storing":
      {
        const placeToManage = getByIdOrNew(creepMemory.managePoint, () =>
          minBy(towersSpawnContainers(towerbro.room, 10), t => t.store.getUsedCapacity(RESOURCE_ENERGY))
        );
        if (!placeToManage) {
          changeState("storing", towerbro);
          if (Game.time % 3 === 0) towerbro.wander();
          break;
        }
        creepMemory.managePoint = placeToManage.id;
        const transferCode = tryDoOrMove(
          () => towerbro.transfer(placeToManage, RESOURCE_ENERGY),
          towerbro.travelTo(placeToManage),
          towerbro,
          placeToManage
        );
        if (transferCode === ERR_FULL) {
          changeState("storing", towerbro);
        } else if (towerbro.store.getUsedCapacity(RESOURCE_ENERGY) <= 1) {
          changeState("getting", towerbro);
        }
      }
      break;
  }
}

const changeState = stateChanger<TowerBroMemory>("storagePoint", "managePoint");
