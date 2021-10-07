import { getPathFromCache } from "cache/path-cache";
import { sources } from "cache/source-cache";
import { NEW_COLONY_SPAWN_SIZE } from "configs";
import { CreepRemoteMemory, tryDoOrMove } from "utils/creeps";
import { ScoutData } from "utils/declarations";
import { log } from "utils/log";

export interface Claimer extends Creep {
  memory: ClaimerMemory;
}

export interface ClaimerMemory extends CreepRemoteMemory {
  role: "claimer";
  targetRoom: string;
  exitPosition?: { x: number; y: number; room: string };
  state: "claiming";
}

export const claimerBody = (energyAvailable: number): BodyPartConstant[] => {
  if (energyAvailable < BODYPART_COST[CLAIM] + BODYPART_COST[MOVE]) {
    return [];
  }
  return [CLAIM, MOVE];
};

export const claimerMemory: ClaimerMemory = {
  newCreep: true,
  role: "claimer",
  state: "claiming",
  originRoom: "",
  targetRoom: ""
};

export function claimerBehavior(creep: Creep): void {
  const claimer = creep as Claimer;
  const creepMemory = claimer.memory;
  if (creepMemory.targetRoom === "") {
    creepMemory.targetRoom = getRoomToClaim(creepMemory.originRoom);
  }
  switch (creepMemory.state) {
    case "claiming":
      if (claimer.room.name === creepMemory.targetRoom) {
        const controller = claimer.room.controller;
        if (controller) {
          if (controller.my) {
            const children = Memory.rooms[creepMemory.originRoom].children;
            if (!children.includes(claimer.room.name)) {
              const place = placeInitialSpawn(claimer.room);
              if (place?.createConstructionSite(STRUCTURE_SPAWN) === OK) {
                children.push(claimer.room.name);
              }
            }
          }
          if (
            tryDoOrMove(
              () => claimer.claimController(controller),
              claimer.travelTo(controller),
              claimer,
              controller
            ) === ERR_GCL_NOT_ENOUGH
          ) {
            tryDoOrMove(() => claimer.reserveController(controller), claimer.travelTo(controller), claimer, controller);
          }
        } else {
          log(`Claimer ${claimer.name} cannot claim the room as it doesn't have the controller!`);
        }
      } else {
        if (!creepMemory.exitPosition || creepMemory.exitPosition.room !== claimer.room.name) {
          const exit = claimer.room.findExitTo(creepMemory.targetRoom);
          if (exit != ERR_NO_PATH && exit != ERR_INVALID_ARGS) {
            const closestExit = claimer.pos.findClosestByRange(exit);
            if (closestExit) {
              creepMemory.exitPosition = { x: closestExit.x, y: closestExit.y, room: claimer.room.name };
            } else log(`Claimer ${claimer.name} can't find an exit to ${creepMemory.targetRoom}`);
          } else log(`Claimer ${claimer.name} can't find a path to ${creepMemory.targetRoom}`);
        }
        if (creepMemory.exitPosition) {
          const exitPos = creepMemory.exitPosition;
          claimer.travelInto(new RoomPosition(exitPos.x, exitPos.y, claimer.room.name));
        }
      }
      break;
  }
}
function getRoomToClaim(originRoom: string): string {
  const sortedByDistance = _.sortBy(
    _.filter(
      Memory.scoutData,
      s =>
        s.controllerLvl === 0 &&
        Object.keys(s.enemyStructures).length === 0 &&
        s.sourcesControllerAverageDistance < 99 &&
        s.sources === 2
    ),
    s => s.sourcesControllerAverageDistance
  );
  const [min, max] = [
    _.first(sortedByDistance).sourcesControllerAverageDistance,
    _.last(sortedByDistance).sourcesControllerAverageDistance
  ];
  const room = _.first(
    _.sortBy(
      _.map(
        _.filter(
          Memory.scoutData,
          s =>
            max !== min &&
            s.controllerLvl === 0 &&
            Object.keys(s.enemyStructures).length === 0 &&
            s.sourcesControllerAverageDistance < 99
        ),
        data => {
          const averageDistance = (max - data.sourcesControllerAverageDistance) / (max - min);
          const allure =
            getAllure(averageDistance, data) + Game.map.getRoomLinearDistance(originRoom, data.roomName) * -0.1;
          return [data.roomName, allure] as [string, number];
        }
      ),
      s => -s[1]
    )
  );
  if (room) {
    return room[0];
  } else return "";
}

export function getAllure(averageDistance: number, data: ScoutData): number {
  const adjacentRooms = [
    getRoomNameOnSide(data.roomName, FIND_EXIT_TOP),
    getRoomNameOnSide(data.roomName, FIND_EXIT_BOTTOM),
    getRoomNameOnSide(data.roomName, FIND_EXIT_LEFT),
    getRoomNameOnSide(data.roomName, FIND_EXIT_RIGHT)
  ].filter(r => r != null);
  const howManyAreMine = _.filter(
    adjacentRooms,
    r => Memory.rooms[r] && Object.keys(Memory.rooms[r]).length > 0
  ).length;
  return (
    averageDistance * 0.5 +
    Math.min(10, _.sum(data.enemies)) * -0.1 +
    data.sources * 0.2 +
    data.swampRatio * -0.1 +
    Math.abs(data.wallRatio - 0.15) * -0.7 +
    howManyAreMine * 0.2
  );
}

const perRoomSubs: Map<string, { [pos: number]: number }> = new Map();

export function placeInitialSpawn(room: Room): RoomPosition | null {
  const terrain = room.getTerrain();
  let subs: { [pos: number]: number } = {};
  if (perRoomSubs.has(room.name)) {
    subs = perRoomSubs.get(room.name) || {};
  } else {
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const cell = terrain.get(x, y);
        const index = x * 50 + y;
        if (cell === TERRAIN_MASK_WALL || x === 0 || y === 0 || x === 49 || y === 49) {
          subs[index] = 0;
        } else {
          let xSub = 0;
          if (x !== 0) {
            xSub = subs[index - 50] || 0;
          }
          let ySub = 0;
          if (y !== 0) {
            ySub = subs[index - 1] || 0;
          }
          let minSub = 0;
          if (x !== 0 && y !== 0) {
            minSub = subs[index - 51] || 0;
          }
          subs[index] = Math.min(xSub, ySub, minSub) + 1;
        }
      }
    }
    perRoomSubs.set(room.name, subs);
  }
  _.forEach(subs, (value, index) => {
    if (value > NEW_COLONY_SPAWN_SIZE) {
      const iIndex = index as unknown as number;
      const x = Math.floor(iIndex / 50);
      const y = iIndex % 50;
      room.visual.text(value.toString(), x, y);
    }
  });
  const stuff = [...sources(room, 1000), ...(room.controller ? [room.controller] : [])];
  const points = _.filter(
    _.map(subs, (v, pos) => [pos, v] as unknown as [number, number]),
    s => s[1] > NEW_COLONY_SPAWN_SIZE
  ).map(pos => [Math.floor(pos[0] / 50), pos[0] % 50, Math.floor(pos[1] / 2)] as [number, number, number]);
  const spawnPoint = minBy(points, p =>
    stuff.reduce(
      (acc, s) => acc + getPathFromCache(s.pos, new RoomPosition(p[0] - p[2], p[1] - p[2], room.name)).length,
      Math.abs(p[0] - 25) + Math.abs(p[1] - 25) - p[2] * 5
    )
  );
  if (spawnPoint) {
    return room.getPositionAt(spawnPoint[0] - spawnPoint[2], spawnPoint[1] - spawnPoint[2]);
  }
  console.log(`Cannot find good spawn point for room ${room.name}`);
  return null;
}
