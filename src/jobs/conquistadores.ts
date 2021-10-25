import { activeSources } from "cache/source-cache";
import { constructionSites, mySpawns } from "cache/structure-cache";
import { energyContainerNotEmpty, fillBody, getByIdOrNew, tryDoOrMove } from "utils/creeps";
import { log } from "utils/log";

import { CreepRemoteMemory, stateChanger } from "../utils/creeps/role-memory";

export interface Conquistadores extends Creep {
  memory: ConquistadoresMemory;
}

export interface ConquistadoresMemory extends CreepRemoteMemory {
  role: "conquistadores";

  sourcePoint?: Id<StructureStorage | StructureContainer | StructureSpawn>;
  exitPosition?: { x: number; y: number; room: string };
  targetRoom: string;
  buildPoint?: Id<ConstructionSite>;

  state: "conquering" | "sourcing" | "mining";
}

export const conquistadoresBody = fillBody.bind(undefined, 18, [
  WORK,
  CARRY,
  MOVE,
  CARRY,
  MOVE,
  CARRY,
  MOVE,
  CARRY,
  MOVE
]);

export const conquistadoresMemory: ConquistadoresMemory = {
  newCreep: true,
  role: "conquistadores",
  sourcePoint: undefined,
  buildPoint: undefined,
  targetRoom: "",
  originRoom: "",
  state: "sourcing"
};

export function conquistadoresBehavior(creep: Creep): void {
  const conquistadores = creep as Conquistadores;
  const creepMemory = conquistadores.memory;
  if (creepMemory.targetRoom === "") {
    const roomsToBuild = Memory.rooms[creepMemory.originRoom].children
      .map(c => Game.rooms[c])
      .filter(r => (r.controller?.my ?? false) && r.controller?.progress === 0 && mySpawns(r).length === 0);
    creepMemory.targetRoom = _.first(roomsToBuild).name;
  }
  switch (creepMemory.state) {
    case "conquering":
      {
        if (conquistadores.store.getUsedCapacity() === 0) {
          const rest = conquistadores.room.find(FIND_DROPPED_RESOURCES).filter(r => r.resourceType === RESOURCE_ENERGY);
          if (rest.length > 0) {
            tryDoOrMove(() => conquistadores.pickup(rest[0]), conquistadores.travelTo(rest[0]));
          } else {
            const restRuins = conquistadores.room
              .find(FIND_RUINS)
              .filter(r => r.store.getUsedCapacity(RESOURCE_ENERGY) > 0);
            if (restRuins.length > 0) {
              tryDoOrMove(
                () => conquistadores.withdraw(restRuins[0], RESOURCE_ENERGY),
                conquistadores.travelTo(restRuins[0])
              );
            } else {
              changeState("mining", conquistadores);
            }
          }
          break;
        }
        if (creepMemory.originRoom === undefined) {
          log(`Conquistadores ${creep.name} missing source room`);
          break;
        }
        if (creep.room.name === creepMemory.targetRoom) {
          const site = minBy(constructionSites(conquistadores.room, 50), s => s.pos.getRangeTo(conquistadores));
          if (!site) {
            creepMemory.targetRoom = "";
            break;
          }
          tryDoOrMove(() => conquistadores.build(site), conquistadores.travelTo(site));
        } else {
          if (!creepMemory.exitPosition || creepMemory.exitPosition.room !== conquistadores.room.name) {
            const exit = conquistadores.room.findExitTo(creepMemory.targetRoom);
            if (exit != ERR_NO_PATH && exit != ERR_INVALID_ARGS) {
              const closestExit = conquistadores.pos.findClosestByRange(exit);
              if (closestExit) {
                creepMemory.exitPosition = { x: closestExit.x, y: closestExit.y, room: conquistadores.room.name };
              } else log(`Conquistadores ${conquistadores.name} can't find an exit to ${creepMemory.targetRoom}`);
            } else log(`Conquistadores ${conquistadores.name} can't find a path to ${creepMemory.targetRoom}`);
          }
          if (creepMemory.exitPosition) {
            const exitPos = creepMemory.exitPosition;
            conquistadores.travelInto(new RoomPosition(exitPos.x, exitPos.y, conquistadores.room.name));
          }
        }
      }
      break;

    case "mining":
      {
        const source = minBy(activeSources(conquistadores.room, 50), s => s.pos.getRangeTo(conquistadores));
        if (
          source &&
          (conquistadores.store.getFreeCapacity() === 0 ||
            tryDoOrMove(() => conquistadores.harvest(source), conquistadores.travelTo(source)) === ERR_FULL)
        ) {
          changeState("conquering", conquistadores);
        }
      }
      break;

    case "sourcing":
      {
        if (conquistadores.room.name === creepMemory.originRoom) {
          const storage = getByIdOrNew(creepMemory.sourcePoint, energyContainerNotEmpty(conquistadores, true));
          if (!storage) break;
          if (!storage.store || storage.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            changeState("sourcing", conquistadores);
            break;
          }
          creepMemory.sourcePoint = storage.id;
          if (
            conquistadores.store.getFreeCapacity() === 0 ||
            tryDoOrMove(() => conquistadores.withdraw(storage, RESOURCE_ENERGY), conquistadores.travelTo(storage)) ===
              ERR_FULL
          ) {
            changeState("conquering", conquistadores);
          } else if (conquistadores.store.getUsedCapacity(RESOURCE_ENERGY) <= 1) {
            changeState("sourcing", conquistadores);
          }
        } else {
          if (!creepMemory.exitPosition || creepMemory.exitPosition.room !== conquistadores.room.name) {
            const exit = conquistadores.room.findExitTo(creepMemory.originRoom);
            if (exit != ERR_NO_PATH && exit != ERR_INVALID_ARGS) {
              const closestExit = conquistadores.pos.findClosestByRange(exit);
              if (closestExit) {
                creepMemory.exitPosition = { x: closestExit.x, y: closestExit.y, room: conquistadores.room.name };
              } else log(`Conquistadores ${conquistadores.name} can't find an exit to ${creepMemory.originRoom}`);
            } else log(`Conquistadores ${conquistadores.name} can't find a path to ${creepMemory.originRoom}`);
          }
          if (creepMemory.exitPosition) {
            const exitPos = creepMemory.exitPosition;
            conquistadores.travelInto(new RoomPosition(exitPos.x, exitPos.y, conquistadores.room.name));
          }
        }
      }
      break;
  }
}

const changeState = stateChanger<ConquistadoresMemory>("buildPoint", "sourcePoint", "exitPosition");
