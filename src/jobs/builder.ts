import { constructionSites, structuresToRepair } from "cache/structure-cache";
import { ENERGY_NOT_EMPTY_MARK } from "configs";
import { energyContainerNotEmpty, fillBody, getByIdOrNew, tryDoOrMove } from "utils/creeps";

import { CreepRoleMemory, stateChanger } from "../utils/creeps/role-memory";
import { beginSacrifice } from "./sacrifice";

export interface Builder extends Creep {
  memory: BuilderMemory;
}

export interface BuilderMemory extends CreepRoleMemory {
  role: "builder";

  sourcePoint?: Id<StructureStorage | StructureContainer | StructureSpawn | Ruin>;

  buildPoint?: Id<ConstructionSite>;
  repairPoint?: Id<AnyStructure>;

  state: "building" | "repairing" | "sourcing";
}

export const builderBody = fillBody.bind(undefined, 21, [WORK, CARRY, MOVE]);

export const builderMemory: BuilderMemory = {
  newCreep: true,
  role: "builder",
  sourcePoint: undefined,
  buildPoint: undefined,
  state: "sourcing"
};

export function builderBehavior(creep: Creep): void {
  const builder = creep as Builder;
  const creepMemory = builder.memory;

  if (
    constructionSites(builder.room, 10).length === 0 &&
    structuresToRepair(builder.room, 2).length === 0 &&
    Math.random() < 0.01
  ) {
    beginSacrifice(builder);
    return;
  }

  switch (creepMemory.state) {
    case "sourcing":
      {
        if (changeStateIfFull(builder, creepMemory)) return;
        const source = getByIdOrNew<StructureStorage | StructureContainer | StructureSpawn | Ruin>(
          creepMemory.sourcePoint,
          () =>
            _.sample(builder.room.find(FIND_RUINS).filter(r => r.store.getUsedCapacity(RESOURCE_ENERGY) > 0)) ??
            energyContainerNotEmpty(builder, true)()
        );
        if (!source || !source.store || source.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
          if (Game.time % 3 === 0) {
            builder.wander();
          }
          creepMemory.sourcePoint = undefined;
          break;
        }
        if (source.store.getUsedCapacity(RESOURCE_ENERGY) < ENERGY_NOT_EMPTY_MARK && !(source instanceof Ruin)) {
          changeState("sourcing", builder);
          break;
        }
        creepMemory.sourcePoint = source.id;
        tryDoOrMove(
          () => builder.withdraw(source, RESOURCE_ENERGY),
          builder.travelTo(source, undefined, { range: 1, ignoreContainers: false, ignoreCreeps: false })
        );
        changeStateIfFull(builder, creepMemory);
      }
      break;

    case "building":
      {
        const site = getByIdOrNew(creepMemory.buildPoint, () =>
          minBy(
            constructionSites(builder.room, 10),
            s => s.progressTotal - s.progress + s.pos.getRangeTo(builder) * 100
          )
        );
        if (!site) {
          changeState("sourcing", builder);
          break;
        }
        creepMemory.buildPoint = site.id;
        if (builder.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
          const energySpot = site.pos.lookFor(LOOK_ENERGY);
          if (energySpot.length > 0 && energySpot[0].amount > 50) {
            tryDoOrMove(
              () => builder.pickup(energySpot[0]),
              builder.travelTo(site, undefined, { range: 1, ignoreContainers: false, ignoreCreeps: false })
            );
          } else changeState("sourcing", builder);
        } else {
          tryDoOrMove(
            () => builder.build(site),
            builder.travelTo(site, undefined, { range: 1, ignoreContainers: false, ignoreCreeps: false })
          );
        }
      }
      break;

    case "repairing":
      {
        const site = getByIdOrNew(creepMemory.repairPoint, () => _.sample(structuresToRepair(builder.room, 2)));
        if (!site || site.hits >= site.hitsMax) {
          changeState("sourcing", builder);
          break;
        }
        creepMemory.repairPoint = site.id;
        tryDoOrMove(() => builder.repair(site), builder.travelTo(site, undefined, { range: 1 }));
        if (builder.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
          changeState("sourcing", builder);
        }
      }
      break;
  }
}

const changeState = stateChanger<BuilderMemory>("buildPoint", "repairPoint", "sourcePoint");

function changeStateIfFull(builder: Builder, creepMemory: BuilderMemory): boolean {
  if (builder.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
    if (builder.room.memory.prioritizeBuilding) {
      if (constructionSites(builder.room, 10).length === 0) {
        if (creepMemory.repairPoint || structuresToRepair(builder.room, 2).length > 0) {
          changeState("repairing", builder);
          return true;
        } else if (Game.time % 3 === 0) builder.wander();
      } else {
        changeState("building", builder);
        return true;
      }
    } else {
      if (creepMemory.repairPoint || structuresToRepair(builder.room, 2).length > 0) {
        changeState("repairing", builder);
        return true;
      } else {
        if (constructionSites(builder.room, 10).length > 0) {
          changeState("building", builder);
          return true;
        } else if (Game.time % 3 === 0) builder.wander();
      }
    }
  }
  return false;
}
