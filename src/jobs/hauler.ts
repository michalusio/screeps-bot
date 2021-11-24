import { droppedEnergy, sources } from "cache/source-cache";
import { sourceContainers } from "cache/structure-cache";
import { HAUL_PRIORITY } from "configs";
import { energyContainerNotFull, fillBody, getByIdOrNew, PERFORMED_ACTION, tryDoOrMove } from "utils/creeps";

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

export const haulerBody = (energy: number): BodyPartConstant[] => {
  return energy > 500 ? fillBody(30, [MOVE, CARRY, CARRY], energy) : fillBody(20, [MOVE, CARRY], energy);
};

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
    _.sortBy(cache, r => -r.amount / Math.max(0.5, r.pos.getRangeTo(hauler.pos))),
    r => r.pos.isNearTo(hauler) || r.pos.getFreeSpaceAround() > 0
  );
};

const findTombstoneResource = (hauler: Hauler) => () => {
  return _.find(
    _.sortBy(
      hauler.room.find(FIND_TOMBSTONES).filter(r => r.store.getUsedCapacity(RESOURCE_ENERGY) > 10),
      r => -r.store.getUsedCapacity(RESOURCE_ENERGY) / Math.max(0.5, r.pos.getRangeTo(hauler.pos))
    ),
    r => r.pos.isNearTo(hauler) || r.pos.getFreeSpaceAround() > 0
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
        const firstToGo = _.sortBy(
          [
            [creepMemory.energyPoint, "energy"],
            [creepMemory.tombPoint, "tombstone"],
            [creepMemory.containerPoint, "container"]
          ] as ([Id<Resource>, "energy"] | [Id<Tombstone>, "tombstone"] | [Id<StructureContainer>, "container"])[],
          a => {
            let grade = HAUL_PRIORITY[a[1]] * 10;
            const obj = a[0] ? Game.getObjectById(a[0]) : null;
            if (obj != null) {
              const amount = obj instanceof Resource ? obj.amount : obj.store.getUsedCapacity(RESOURCE_ENERGY);
              grade -= amount > 100 ? amount / Math.max(1, obj.pos.getRangeTo(hauler)) : 0;
            } else grade += 100;
            return grade;
          }
        );
        for (const [id, type] of firstToGo) {
          const item = Game.getObjectById(id);
          if (
            item &&
            item.pos.getRangeTo(hauler) > 15 &&
            hauler.store.getUsedCapacity() > hauler.store.getCapacity() * 0.8
          ) {
            hauler.memory.waitedForStuff = 0;
            changeState("storing", hauler);
            return;
          }
          switch (type) {
            case "energy":
              if (getDroppedEnergy(hauler, creepMemory)) {
                creepMemory.tombPoint = undefined;
                creepMemory.containerPoint = undefined;
                return;
              }
              break;
            case "tombstone":
              if (getTombstoneEnergy(hauler, creepMemory)) {
                creepMemory.energyPoint = undefined;
                creepMemory.containerPoint = undefined;
                return;
              }
              break;
            case "container":
              if (getContainerEnergy(hauler, creepMemory)) {
                creepMemory.energyPoint = undefined;
                creepMemory.tombPoint = undefined;
                return;
              }
              break;
          }
        }
        hauler.wander();
      }
      break;

    case "storing":
      {
        if (hauler.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
          changeState("getting", hauler);
          return;
        }
        const storage = getByIdOrNew(creepMemory.storagePoint, energyContainerNotFull(hauler));
        if (!storage) break;
        if (!storage.store || storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
          changeState("storing", hauler);
          break;
        }
        creepMemory.storagePoint = storage.id;
        const transferCode = tryDoOrMove(
          () => hauler.transfer(storage, RESOURCE_ENERGY),
          hauler.travelTo(storage, avoidSources, { ignoreCreeps: false, ignoreContainers: false })
        );
        if (
          transferCode === ERR_FULL ||
          storage.store.getFreeCapacity(RESOURCE_ENERGY) <= (storage.structureType === "spawn" ? 30 : 0) ||
          (transferCode === PERFORMED_ACTION &&
            storage.store.getFreeCapacity(RESOURCE_ENERGY) <= hauler.store.getUsedCapacity(RESOURCE_ENERGY))
        ) {
          changeState("storing", hauler);
          //haulerBehavior(hauler);
        } else if (hauler.store.getUsedCapacity(RESOURCE_ENERGY) <= 1) {
          changeState("getting", hauler);
          //haulerBehavior(hauler);
        }
      }
      break;
  }
}

function getDroppedEnergy(hauler: Hauler, memory: HaulerMemory): boolean {
  const energy = getByIdOrNew(memory.energyPoint, findNewResource(hauler));
  if (energy && energy.amount > 0) {
    memory.energyPoint = energy.id;
    const code = tryDoOrMove(
      () => hauler.pickup(energy),
      hauler.travelTo(energy, avoidSources, { ignoreCreeps: true })
    );
    if (hauler.pos.isNearTo(energy)) memory.waitedForStuff++;
    checkIfFull(hauler);
    return code === OK;
  } else memory.energyPoint = undefined;
  return false;
}

function getTombstoneEnergy(hauler: Hauler, memory: HaulerMemory): boolean {
  const tombstone = getByIdOrNew(memory.tombPoint, findTombstoneResource(hauler));
  if (tombstone && tombstone.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
    memory.tombPoint = tombstone.id;
    const code = tryDoOrMove(
      () => hauler.withdraw(tombstone, RESOURCE_ENERGY),
      hauler.travelTo(tombstone, avoidSources, { ignoreCreeps: true })
    );
    if (hauler.pos.isNearTo(tombstone)) memory.waitedForStuff++;
    checkIfFull(hauler);
    return code === OK;
  } else memory.tombPoint = undefined;
  return false;
}

function getContainerEnergy(hauler: Hauler, memory: HaulerMemory): boolean {
  const container = getByIdOrNew(memory.containerPoint, () =>
    minBy(
      sourceContainers(hauler.room, 10),
      c => -c.store.getUsedCapacity(RESOURCE_ENERGY) / Math.max(0.5, c.pos.getRangeTo(hauler))
    )
  );
  if (container && container.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
    memory.containerPoint = container.id;
    const code = tryDoOrMove(
      () => hauler.withdraw(container, RESOURCE_ENERGY),
      hauler.travelTo(container, avoidSources, { ignoreCreeps: true, ignoreContainers: false })
    );
    if (hauler.pos.isNearTo(container)) memory.waitedForStuff++;
    checkIfFull(hauler);
    return code === OK;
  } else memory.containerPoint = undefined;
  return false;
}

const changeState = stateChanger<HaulerMemory>("storagePoint", "energyPoint", "tombPoint", "containerPoint");

function checkIfFull(hauler: Hauler): void {
  if (hauler.store.getUsedCapacity(RESOURCE_ENERGY) >= hauler.store.getCapacity()) {
    hauler.memory.waitedForStuff = 0;
    changeState("storing", hauler);
    //haulerBehavior(hauler);
  }
}
