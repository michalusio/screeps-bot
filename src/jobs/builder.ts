import { constructionSites, structuresToRepair } from "cache/structure-cache";
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

export const builderBody = fillBody.bind(undefined, 20, [WORK, CARRY, MOVE]);

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

  if (constructionSites(builder.room, 50).length === 0) {
    beginSacrifice(builder);
    return;
  }

  switch (creepMemory.state) {
    case "sourcing":
      {
        changeStateIfFull(builder, creepMemory);
        const source = getByIdOrNew<StructureStorage | StructureContainer | StructureSpawn | Ruin>(
          creepMemory.sourcePoint,
          () =>
            _.sample(builder.room.find(FIND_RUINS).filter(r => r.store.getUsedCapacity(RESOURCE_ENERGY) > 0)) ??
            energyContainerNotEmpty(builder)()
        );
        if (!source || !source.store || source.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
          if (Game.time % 3 === 0) {
            builder.wander();
          }
          creepMemory.sourcePoint = undefined;
          break;
        }
        if (source.store.getUsedCapacity(RESOURCE_ENERGY) < 200 && !(source instanceof Ruin)) {
          changeState("sourcing", builder);
          break;
        }
        creepMemory.sourcePoint = source.id;
        tryDoOrMove(() => builder.withdraw(source, RESOURCE_ENERGY), builder.travelTo(source));
        changeStateIfFull(builder, creepMemory);
      }
      break;

    case "building":
      {
        const site = getByIdOrNew(creepMemory.buildPoint, () =>
          minBy(
            constructionSites(builder.room, 50),
            s => s.progressTotal - s.progress + s.pos.getRangeTo(builder) * 100
          )
        );
        if (!site) {
          changeState("sourcing", builder);
          break;
        }
        creepMemory.buildPoint = site.id;
        tryDoOrMove(() => builder.build(site), builder.travelTo(site));
        if (builder.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
          changeState("sourcing", builder);
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
        tryDoOrMove(() => builder.repair(site), builder.travelTo(site));
        if (builder.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
          changeState("sourcing", builder);
        }
      }
      break;
  }
}

const changeState = stateChanger<BuilderMemory>("buildPoint", "repairPoint", "sourcePoint");

function changeStateIfFull(builder: Builder, creepMemory: BuilderMemory) {
  if (builder.store.getUsedCapacity(RESOURCE_ENERGY) >= builder.store.getCapacity()) {
    if (builder.room.memory.prioritizeBuilding) {
      if (constructionSites(builder.room, 50).length === 0) {
        if (creepMemory.repairPoint || structuresToRepair(builder.room, 2).length > 0) {
          changeState("repairing", builder);
        } else if (Game.time % 3 === 0) builder.wander();
      } else {
        changeState("building", builder);
      }
    } else {
      if (creepMemory.repairPoint || structuresToRepair(builder.room, 2).length > 0) {
        changeState("repairing", builder);
      } else {
        if (constructionSites(builder.room, 50).length === 0) {
          changeState("building", builder);
        } else if (Game.time % 3 === 0) builder.wander();
      }
    }
  }
}
