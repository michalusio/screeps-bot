import { energyContainerNotEmpty, getByIdOrNew, tryDoOrMove } from "utils/creeps";

import { CreepRoleMemory, stateChanger } from "../utils/creeps/role-memory";

export interface Upgrader extends Creep {
  memory: UpgraderMemory;
}

export interface UpgraderMemory extends CreepRoleMemory {
  role: "upgrader";

  sourcePoint?: Id<StructureStorage | StructureContainer | StructureSpawn>;

  state: "upgrading" | "sourcing";
}

export const upgraderBody = (energyAvailable: number): BodyPartConstant[] => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  while (energy > 50 && body.length < 20) {
    if (energy < 50) break;
    body.push(MOVE);
    energy -= 50;
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
  role: "upgrader",
  sourcePoint: undefined,
  state: "sourcing"
};

export function upgraderBehavior(creep: Creep): void {
  const upgrader = creep as Upgrader;
  const creepMemory = upgrader.memory;
  switch (creepMemory.state) {
    case "sourcing":
      {
        const source = getByIdOrNew(creepMemory.sourcePoint, energyContainerNotEmpty(upgrader));
        if (!source) {
          changeState("sourcing", upgrader);
          if (Game.time % 3 === 0) upgrader.wander();
          break;
        }
        creepMemory.sourcePoint = source.id;
        if (tryDoOrMove(() => upgrader.withdraw(source, RESOURCE_ENERGY), upgrader.travelTo(source)) !== OK) {
          upgrader.wander();
        }
        if (upgrader.store.getUsedCapacity(RESOURCE_ENERGY) >= upgrader.store.getCapacity()) {
          changeState("upgrading", upgrader);
        }
      }
      break;

    case "upgrading":
      {
        const controller = upgrader.room.controller;
        if (!controller) break;
        tryDoOrMove(() => upgrader.upgradeController(controller), upgrader.travelTo(controller));
        if (upgrader.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
          changeState("sourcing", upgrader);
        }
      }
      break;
  }
}

const changeState = stateChanger<UpgraderMemory>("sourcePoint");
