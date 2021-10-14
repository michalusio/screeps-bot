import { droppedEnergy, sources } from "cache/source-cache";
import { sourceContainers } from "cache/structure-cache";
import { energyContainerNotFull, fillBody, getByIdOrNew, tryDoOrMove } from "utils/creeps";

import { CreepRoleMemory, stateChanger } from "../utils/creeps/role-memory";

export interface Hauler extends Creep {
  memory: HaulerMemory;
}

export interface HaulerMemory extends CreepRoleMemory {
  role: "hauler";

  energyPoint?: Id<Resource>;
  tombPoint?: Id<Tombstone>;
  containerPoint?: Id<StructureContainer>;
  waitedForStuff: number;

  storagePoint?: Id<StructureStorage | StructureSpawn | StructureContainer | StructureExtension>;

  state: "getting" | "storing";
}

export const haulerBody = fillBody.bind(undefined, 21, [MOVE, CARRY, CARRY]);

export const haulerMemory: HaulerMemory = {
  newCreep: true,
  role: "hauler",
  energyPoint: undefined,
  storagePoint: undefined,
  containerPoint: undefined,
  tombPoint: undefined,
  waitedForStuff: 0,
  state: "getting"
};

const avoidSources = (room: Room): RoomPosition[] => sources(room, 1000).flatMap(s => s.pos.getAround(1));
const findNewResource = (hauler: Hauler) => () => {
  const cache = droppedEnergy(hauler.room, 1);
  return _.find(
    _.sortBy(cache, r => r.pos.getRangeTo(hauler.pos)),
    r => r.pos.getFreeSpaceAround() > 0 || r.pos.isNearTo(hauler)
  );
};

const findTombstoneResource = (hauler: Hauler) => () => {
  return _.find(
    _.sortBy(
      hauler.room.find(FIND_TOMBSTONES).filter(r => r.store.getUsedCapacity(RESOURCE_ENERGY) > 10),
      r => r.pos.getRangeTo(hauler.pos) * 10 - r.store.getUsedCapacity(RESOURCE_ENERGY)
    ),
    r => r.pos.getFreeSpaceAround() > 0 || r.pos.isNearTo(hauler)
  );
};

export function haulerBehavior(creep: Creep): void {
  const hauler = creep as Hauler;
  const creepMemory = hauler.memory;
  switch (creepMemory.state) {
    case "getting":
      {
        if (creepMemory.waitedForStuff > 5) {
          creepMemory.waitedForStuff = 0;
          changeState("getting", hauler);
        }
        const order = (
          [
            [creepMemory.energyPoint, "droppedEnergy"],
            [creepMemory.tombPoint, "tombstone"],
            [creepMemory.containerPoint, "container"]
          ] as (
            | [Id<Resource>, "droppedEnergy"]
            | [Id<Tombstone>, "tombstone"]
            | [Id<StructureContainer>, "container"]
          )[]
        ).sort(a => Math.random() * (a[0] != null ? 1 : -1));
        for (const [, type] of order) {
          switch (type) {
            case "droppedEnergy":
              {
                const energy = getByIdOrNew(creepMemory.energyPoint, findNewResource(hauler));
                if (energy) {
                  creepMemory.energyPoint = energy.id;
                  tryDoOrMove(
                    () => hauler.pickup(energy),
                    hauler.travelTo(energy, avoidSources, { ignoreCreeps: true }),
                    hauler,
                    energy
                  );
                  if (hauler.pos.isNearTo(energy)) creepMemory.waitedForStuff++;
                  checkIfFull(hauler);
                  return;
                } else creepMemory.energyPoint = undefined;
              }
              break;
            case "tombstone":
              {
                const tombstone = getByIdOrNew(creepMemory.tombPoint, findTombstoneResource(hauler));
                if (tombstone) {
                  creepMemory.tombPoint = tombstone.id;
                  tryDoOrMove(
                    () => hauler.withdraw(tombstone, RESOURCE_ENERGY),
                    hauler.travelTo(tombstone, avoidSources, { ignoreCreeps: true }),
                    hauler,
                    tombstone
                  );
                  if (hauler.pos.isNearTo(tombstone)) creepMemory.waitedForStuff++;
                  checkIfFull(hauler);
                  return;
                } else creepMemory.tombPoint = undefined;
              }
              break;
            case "container":
              {
                const container = getByIdOrNew(creepMemory.containerPoint, () =>
                  minBy(
                    sourceContainers(hauler.room, 10),
                    c => c.pos.getRangeTo(hauler) * 10 - c.store.getUsedCapacity(RESOURCE_ENERGY)
                  )
                );
                if (container) {
                  creepMemory.containerPoint = container.id;
                  tryDoOrMove(
                    () => hauler.withdraw(container, RESOURCE_ENERGY),
                    hauler.travelTo(container, avoidSources, { ignoreCreeps: true }),
                    hauler,
                    container
                  );
                  if (hauler.pos.isNearTo(container)) creepMemory.waitedForStuff++;
                  checkIfFull(hauler);
                  return;
                } else creepMemory.containerPoint = undefined;
              }
              break;
          }
        }
        hauler.wander();
      }
      break;

    case "storing":
      {
        const storage = getByIdOrNew(creepMemory.storagePoint, energyContainerNotFull(hauler));
        if (!storage) break;
        if (!storage.store || storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
          changeState("storing", hauler);
          break;
        }
        creepMemory.storagePoint = storage.id;
        const transferCode = tryDoOrMove(
          () => hauler.transfer(storage, RESOURCE_ENERGY),
          hauler.travelTo(storage, avoidSources, { ignoreCreeps: true }),
          hauler,
          storage
        );
        if (
          transferCode === ERR_FULL ||
          storage.store.getFreeCapacity(RESOURCE_ENERGY) <= (storage.structureType === "spawn" ? 30 : 0)
        ) {
          changeState("storing", hauler);
          haulerBehavior(hauler);
        } else if (hauler.store.getUsedCapacity(RESOURCE_ENERGY) <= 1) {
          changeState("getting", hauler);
          haulerBehavior(hauler);
        }
      }
      break;
  }
}

const changeState = stateChanger<HaulerMemory>("energyPoint", "storagePoint", "tombPoint", "containerPoint");

function checkIfFull(hauler: Hauler): void {
  if (hauler.store.getUsedCapacity(RESOURCE_ENERGY) >= hauler.store.getCapacity()) {
    hauler.memory.waitedForStuff = 0;
    changeState("storing", hauler);
    haulerBehavior(hauler);
  }
}
