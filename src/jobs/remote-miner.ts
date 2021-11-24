import { activeSources } from "cache/source-cache";
import { hostileSpawns, mySpawns } from "cache/structure-cache";
import { energyContainerNotFull, fillBody, getByIdOrNew, tryDoOrMove } from "utils/creeps";
import { log } from "utils/log";
import { getRoomsAround, isRoomRemoteSafe } from "utils/room-utils";

import { CreepRemoteMemory, stateChanger } from "../utils/creeps/role-memory";

export interface RemoteMiner extends Creep {
  memory: RemoteMinerMemory;
}

export interface RemoteMinerMemory extends CreepRemoteMemory {
  role: "remoteminer";
  sourceRoom?: string;

  storagePoint?: Id<StructureStorage | StructureSpawn | StructureContainer | StructureExtension>;
  sourcePoint?: { x: number; y: number; roomName: string };

  exitPosition?: { x: number; y: number; roomName: string };

  state: "mining" | "hauling";
}

export const remoteMinerBody = fillBody.bind(undefined, 20, [MOVE, MOVE, WORK, CARRY]);

export const remoteMinerMemory: RemoteMinerMemory = {
  newCreep: true,
  role: "remoteminer",
  originRoom: "",
  sourceRoom: undefined,
  sourcePoint: undefined,
  state: "mining"
};

export function remoteMinerBehavior(creep: Creep): void {
  const remoteMiner = creep as RemoteMiner;
  const creepMemory = remoteMiner.memory;
  if (creepMemory.sourceRoom === undefined) {
    creepMemory.sourceRoom = minBy(
      getRoomsAround(creepMemory.originRoom).filter(
        name => name != null && isRoomRemoteSafe(name) && !Memory.noRemoteMining.includes(name)
      ),
      r =>
        Object.keys(Game.creeps)
          .map(c => Game.creeps[c])
          .filter(c => c.roleMemory.role === "remoteminer" && (c.roleMemory as RemoteMinerMemory).sourceRoom === r)
          .length
    );
    if (creepMemory.sourceRoom) {
      log(`Remote miner ${remoteMiner.name} chose source room: ${creepMemory.sourceRoom}`);
      const remotes = Memory.rooms[creepMemory.originRoom].remotes;
      if (!remotes.includes(creepMemory.sourceRoom)) {
        remotes.push(creepMemory.sourceRoom);
      }
    } else log(`Remote miner ${remoteMiner.name} chose source room: ${creepMemory.sourceRoom}`);
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
              _.forEach(Memory.rooms, r => {
                if (r.remotes) {
                  r.remotes = r.remotes.filter(r => r !== creep.room.name);
                }
              });
            }
            creepMemory.sourceRoom = undefined;
            return;
          }
          if (creepMemory.sourcePoint === undefined) {
            creepMemory.sourcePoint =
              remoteMiner.room.name === creepMemory.sourceRoom
                ? minBy(activeSources(remoteMiner.room, 50), s => s.pos.getRangeTo(remoteMiner))?.pos
                : undefined;
          }
        }
        const source = creepMemory.sourcePoint;
        let code = 0;
        if (source) {
          code = tryDoOrMove(() => {
            if (creepMemory.sourceRoom !== remoteMiner.room.name) return ERR_NOT_IN_RANGE;
            if (!creepMemory.sourcePoint || !creepMemory.sourceRoom || !Game.rooms[creepMemory.sourceRoom])
              return ERR_NOT_IN_RANGE;
            const src = Game.rooms[creepMemory.sourceRoom].lookForAt(
              LOOK_SOURCES,
              creepMemory.sourcePoint.x,
              creepMemory.sourcePoint.y
            )[0];
            return remoteMiner.harvest(src);
          }, remoteMiner.travelTo(new RoomPosition(source.x, source.y, source.roomName), undefined, { ignoreCreeps: false, ignoreRoads: false, reusePath: 50 }));
        } else {
          code = tryDoOrMove(
            () => ERR_NOT_IN_RANGE,
            remoteMiner.travelTo(
              new RoomPosition(
                creepMemory.sourcePoint?.x ?? Math.floor(Math.random() * 50),
                creepMemory.sourcePoint?.y ?? Math.floor(Math.random() * 50),
                creepMemory.sourceRoom
              ),
              undefined,
              {
                ignoreCreeps: false,
                ignoreRoads: false,
                reusePath: 50
              }
            )
          );
        }
        if (code === ERR_NOT_ENOUGH_RESOURCES) {
          changeState("hauling", remoteMiner);
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
            remoteMiner.travelTo(storage, undefined, { ignoreCreeps: false, ignoreRoads: false })
          );
          if (transferCode === ERR_FULL) {
            changeState("hauling", remoteMiner);
          } else if (remoteMiner.store.getUsedCapacity(RESOURCE_ENERGY) <= 1) {
            changeState("mining", remoteMiner);
          }
        } else {
          remoteMiner.travelInto(new RoomPosition(25, 25, creepMemory.originRoom), undefined, {
            ignoreCreeps: false,
            ignoreRoads: false,
            reusePath: 50
          });
        }
      }
      break;
  }
}

const changeState = stateChanger<RemoteMinerMemory>("storagePoint", "exitPosition");
