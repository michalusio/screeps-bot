import { CreepRemoteMemory, tryDoOrMove } from "utils/creeps";
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
              if (placeInitialSpawn(claimer.room)) {
                children.push(claimer.room.name);
              }
            }
          }
          tryDoOrMove(() => claimer.claimController(controller), claimer.travelTo(controller));
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
            averageDistance * 0.5 +
            Math.min(10, _.sum(data.enemies)) * -0.1 +
            data.sources * 0.2 +
            data.swampRatio * -0.1 +
            Math.abs(data.wallRatio - 0.3) * -0.1 +
            Game.map.getRoomLinearDistance(originRoom, data.roomName) * -0.1;
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

function placeInitialSpawn(room: Room) {
  const terrain = room.getTerrain();
  const subs: { [pos: string]: number } = {};
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const cell = terrain.get(x, y);
      if (cell === TERRAIN_MASK_WALL || x === 0 || y === 0 || x === 49 || y === 49) {
        subs[`${x} ${y}`] = 0;
      } else {
        let xSub = 0;
        if (x !== 0) {
          xSub = subs[`${x - 1} ${y}`] || 0;
        }
        let ySub = 0;
        if (y !== 0) {
          ySub = subs[`${x} ${y - 1}`] || 0;
        }
        let minSub = 0;
        if (x !== 0 && y !== 0) {
          minSub = subs[`${x - 1} ${y - 1}`] || 0;
        }
        subs[`${x} ${y}`] = Math.min(xSub, ySub, minSub) + 1;
      }
      const value = subs[`${x} ${y}`] || 0;
      if (value > 5) {
        room.visual.text(value.toString(), x - 2, y - 2);
      }
    }
  }
  const stuff = [...room.find(FIND_SOURCES), ...(room.controller ? [room.controller] : [])];
  const points = _.map(
    _.filter(
      _.map(subs, (v, pos) => [pos, v] as [string, number]),
      s => s[1] > 5
    ),
    s => s[0]
  ).map(pos => pos.split(" ").map(v => parseInt(v)) as [number, number]);
  const spawnPoint = _.first(
    _.sortBy(points, p =>
      stuff.reduce(
        (acc, s) => acc + room.findPath(s.pos, new RoomPosition(p[0] - 2, p[1] - 2, room.name)).length,
        Math.abs(p[0] - 25) + Math.abs(p[1] - 25)
      )
    )
  );
  if (spawnPoint) {
    if (
      (room.getPositionAt(spawnPoint[0] - 2, spawnPoint[1] - 2)?.createConstructionSite(STRUCTURE_SPAWN) ??
        ERR_INVALID_ARGS) === OK
    ) {
      return true;
    }
  }
  console.log(`Cannot find good spawn point for room ${room.name}`);
  return false;
}
