import { anyConstructionSitesIncludingRemotes, constructionSites, structuresToRepair } from "cache/structure-cache";
import { ENERGY_NOT_EMPTY_MARK, REPAIR_PRIORITY } from "configs";
import { energyContainerNotEmpty, fillBody, getByIdOrNew, tryDoOrMove } from "utils/creeps";

import { CreepRemoteMemory, stateChanger } from "../utils/creeps/role-memory";
import { beginSacrifice } from "./sacrifice";

export interface Builder extends Creep {
  memory: BuilderMemory;
}

export interface BuilderMemory extends CreepRemoteMemory {
  role: "builder";

  sourcePoint?: Id<StructureStorage | StructureContainer | StructureSpawn | Ruin>;

  buildPoint?: Id<ConstructionSite>;
  repairPoint?: Id<AnyStructure>;

  state: "building" | "repairing" | "sourcing";
}

export const builderBody = fillBody.bind(undefined, 21, [MOVE, WORK, CARRY]);

export const builderMemory: BuilderMemory = {
  newCreep: true,
  role: "builder",
  originRoom: "",
  sourcePoint: undefined,
  buildPoint: undefined,
  state: "sourcing"
};

export function builderBehavior(creep: Creep): void {
  const builder = creep as Builder;
  const creepMemory = builder.memory;

  if (
    !anyConstructionSitesIncludingRemotes(Game.rooms[creepMemory.originRoom]) &&
    structuresToRepair(Game.rooms[creepMemory.originRoom], 2).length === 0 &&
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
            energyContainerNotEmpty(Game.rooms[creepMemory.originRoom], builder, true)()
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
        tryDoOrMove(
          () => builder.withdraw(source, RESOURCE_ENERGY),
          builder.travelTo(source, undefined, { range: 1, ignoreContainers: false, ignoreCreeps: false })
        );
        creepMemory.sourcePoint = source.id;
        changeStateIfFull(builder, creepMemory);
      }
      break;

    case "building":
      {
        const site = getByIdOrNew(
          creepMemory.buildPoint,
          () =>
            minBy(
              constructionSites(Game.rooms[creepMemory.originRoom], 10),
              s => REPAIR_PRIORITY[s.structureType] * 100000 + s.progressTotal - s.progress + s.pos.getRangeTo(builder)
            ) ??
            minBy(
              Memory.rooms[creepMemory.originRoom].remotes
                .map(r => Game.rooms[r])
                .filter(r => r)
                .flatMap(r => constructionSites(r, 10)),
              s => REPAIR_PRIORITY[s.structureType] * 100000 + s.progressTotal - s.progress
            )
        );
        if (!site) {
          changeState("sourcing", builder);
          break;
        }
        creepMemory.buildPoint = site.id;
        const energySpot = site.pos.lookForAround(LOOK_ENERGY);
        if (energySpot && energySpot.length > 0 && energySpot[0].energy.amount > 50) {
          builder.pickup(energySpot[0].energy);
        } else if (builder.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
          changeState("sourcing", builder);
          return;
        }
        tryDoOrMove(() => {
          if (!builder.pos.isNearTo(site)) return ERR_NOT_IN_RANGE;
          return builder.build(site);
        }, builder.travelTo(site, undefined, { range: 1, ignoreContainers: false, ignoreCreeps: false }));
      }
      break;

    case "repairing":
      {
        const site = getByIdOrNew(creepMemory.repairPoint, () =>
          _.sample(structuresToRepair(Game.rooms[creepMemory.originRoom], 2))
        );
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
    if (Memory.rooms[creepMemory.originRoom].prioritizeBuilding) {
      if (!anyConstructionSitesIncludingRemotes(Game.rooms[creepMemory.originRoom])) {
        if (creepMemory.repairPoint || structuresToRepair(Game.rooms[creepMemory.originRoom], 2).length > 0) {
          changeState("repairing", builder);
          return true;
        } else if (Game.time % 3 === 0) builder.wander();
      } else {
        changeState("building", builder);
        return true;
      }
    } else {
      if (creepMemory.repairPoint || structuresToRepair(Game.rooms[creepMemory.originRoom], 2).length > 0) {
        changeState("repairing", builder);
        return true;
      } else {
        if (anyConstructionSitesIncludingRemotes(Game.rooms[creepMemory.originRoom])) {
          changeState("building", builder);
          return true;
        } else if (Game.time % 3 === 0) builder.wander();
      }
    }
  }
  return false;
}
