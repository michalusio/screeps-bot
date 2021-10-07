import { directionExitsFromSpawn, exitsFromRoomToRoom } from "cache/path-cache";
import { activeSources } from "cache/source-cache";
import { hostileSpawns, mySpawns } from "cache/structure-cache";
import { energyContainerNotFull, fillBody, getByIdOrNew, tryDoOrMove } from "utils/creeps";
import { log } from "utils/log";

import { CreepRemoteMemory, stateChanger } from "../utils/creeps/role-memory";

export interface RemoteMiner extends Creep {
  memory: RemoteMinerMemory;
}

export interface RemoteMinerMemory extends CreepRemoteMemory {
  role: "remoteminer";
  sourceRoom?: string;

  storagePoint?: Id<StructureStorage | StructureSpawn | StructureContainer | StructureExtension>;

  exitPosition?: { x: number; y: number; room: string };

  state: "mining" | "hauling";
}

export const remoteMinerBody = fillBody.bind(undefined, 18, [MOVE, CARRY, WORK]);

export const remoteMinerMemory: RemoteMinerMemory = {
  newCreep: true,
  role: "remoteminer",
  originRoom: "",
  sourceRoom: undefined,
  state: "mining"
};

export function remoteMinerBehavior(creep: Creep): void {
  const remoteMiner = creep as RemoteMiner;
  const creepMemory = remoteMiner.memory;
  if (creepMemory.sourceRoom === undefined) {
    creepMemory.sourceRoom = minBy(
      [
        getRoomNameOnSide(creepMemory.originRoom, FIND_EXIT_TOP),
        getRoomNameOnSide(creepMemory.originRoom, FIND_EXIT_BOTTOM),
        getRoomNameOnSide(creepMemory.originRoom, FIND_EXIT_LEFT),
        getRoomNameOnSide(creepMemory.originRoom, FIND_EXIT_RIGHT)
      ].filter(name => !Memory.noRemoteMining.includes(name)),
      r =>
        Object.keys(Game.creeps)
          .map(c => Game.creeps[c])
          .filter(c => c.roleMemory.role === "remoteminer" && (c.roleMemory as RemoteMinerMemory).sourceRoom === r)
          .length
    );
    log(`Remote miner ${remoteMiner.name} chose source room: ${creepMemory.sourceRoom}`);
  }
  switch (creepMemory.state) {
    case "mining":
      {
        if (remoteMiner.store.getFreeCapacity() === 0) {
          changeState("hauling", remoteMiner);
          return;
        }
        if (creepMemory.sourceRoom === undefined) {
          log(`Remote miner ${creep.name} missing source room`);
          return;
        }
        if (creep.room.name === creepMemory.sourceRoom) {
          const spawns = mySpawns(creep.room).length + hostileSpawns(creep.room, 50).length;
          if (spawns > 0) {
            if (!Memory.noRemoteMining.includes(creep.room.name)) {
              Memory.noRemoteMining.push(creep.room.name);
            }
            creepMemory.sourceRoom = undefined;
            return;
          }
          const source = minBy(activeSources(remoteMiner.room, 50), s => s.pos.getRangeTo(remoteMiner));
          if (
            source &&
            tryDoOrMove(
              () => remoteMiner.harvest(source),
              remoteMiner.travelTo(source, undefined, { reusePath: 20 }),
              remoteMiner,
              source
            ) === ERR_NOT_ENOUGH_RESOURCES
          ) {
            changeState("hauling", remoteMiner);
          }
        } else {
          if (!creepMemory.exitPosition || creepMemory.exitPosition.room !== remoteMiner.room.name) {
            const exit = exitsFromRoomToRoom(remoteMiner.room.name, creepMemory.sourceRoom, 1000);
            if (exit != ERR_NO_PATH && exit != ERR_INVALID_ARGS) {
              const closestExit = directionExitsFromSpawn(remoteMiner.room, 100).find(x => x[2] === exit);
              if (closestExit) {
                creepMemory.exitPosition = { x: closestExit[1].x, y: closestExit[1].y, room: remoteMiner.room.name };
              } else log(`Remote miner ${remoteMiner.name} can't find an exit to ${creepMemory.sourceRoom}`);
            } else log(`Remote miner ${remoteMiner.name} can't find a path to ${creepMemory.sourceRoom}`);
          }
          if (creepMemory.exitPosition) {
            const exitPos = creepMemory.exitPosition;
            remoteMiner.travelInto(new RoomPosition(exitPos.x, exitPos.y, remoteMiner.room.name), undefined, {
              reusePath: 20
            });
          }
        }
      }
      break;

    case "hauling":
      {
        if (remoteMiner.room.name === creepMemory.originRoom) {
          const storage = getByIdOrNew(creepMemory.storagePoint, energyContainerNotFull(remoteMiner));
          if (!storage) return;
          if (!storage.store || storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            changeState("hauling", remoteMiner);
            return;
          }
          creepMemory.storagePoint = storage.id;
          const transferCode = tryDoOrMove(
            () => remoteMiner.transfer(storage, RESOURCE_ENERGY),
            remoteMiner.travelTo(storage, undefined, { reusePath: 20 }),
            remoteMiner,
            storage
          );
          if (transferCode === ERR_FULL) {
            changeState("hauling", remoteMiner);
          } else if (remoteMiner.store.getUsedCapacity(RESOURCE_ENERGY) <= 1) {
            changeState("mining", remoteMiner);
          }
        } else {
          if (!creepMemory.exitPosition || creepMemory.exitPosition.room !== remoteMiner.room.name) {
            const exit = exitsFromRoomToRoom(remoteMiner.room.name, creepMemory.originRoom, 1000);
            if (exit != ERR_NO_PATH && exit != ERR_INVALID_ARGS) {
              const closestExit = directionExitsFromSpawn(remoteMiner.room, 100).find(x => x[2] === exit);
              if (closestExit) {
                creepMemory.exitPosition = { x: closestExit[1].x, y: closestExit[1].y, room: remoteMiner.room.name };
              } else log(`Remote miner ${remoteMiner.name} can't find an exit to ${creepMemory.originRoom}`);
            } else log(`Remote miner ${remoteMiner.name} can't find a path to ${creepMemory.originRoom}`);
          }
          if (creepMemory.exitPosition) {
            const exitPos = creepMemory.exitPosition;
            remoteMiner.travelInto(new RoomPosition(exitPos.x, exitPos.y, remoteMiner.room.name), undefined, {
              reusePath: 20
            });
          }
        }
      }
      break;
  }
}

const changeState = stateChanger<RemoteMinerMemory>("storagePoint", "exitPosition");
