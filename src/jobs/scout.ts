import { segments } from "cache/segment-cache";
import { sourcesAndMineral } from "cache/source-cache";
import { ScoutData } from "utils/declarations";
import { CreepRemoteMemory } from "../utils/creeps/role-memory";

export interface Scout extends Creep {
  memory: ScoutMemory;
}

export interface ScoutMemory extends CreepRemoteMemory {
  role: "scout";

  notifyDisabled: boolean;

  exitPosition: { x: number; y: number; room: string } | null;
  lastDirection: FIND_EXIT_TOP | FIND_EXIT_BOTTOM | FIND_EXIT_RIGHT | FIND_EXIT_LEFT;

  state: "scouting";
}

export const scoutBody = (): BodyPartConstant[] => [MOVE];

export const scoutMemory: ScoutMemory = {
  newCreep: true,
  role: "scout",
  notifyDisabled: false,
  originRoom: "",
  state: "scouting",
  exitPosition: null,
  lastDirection: randomExit()
};

function randomExit(): FIND_EXIT_TOP | FIND_EXIT_BOTTOM | FIND_EXIT_RIGHT | FIND_EXIT_LEFT {
  return (Math.floor(Math.random() * 4) * 2 + 1) as 1 | 3 | 5 | 7;
}

export function scoutBehavior(creep: Creep): void {
  const scout = creep as Scout;
  const creepMemory = scout.memory;
  if (!creepMemory.notifyDisabled) {
    scout.notifyWhenAttacked(false);
    creepMemory.notifyDisabled = true;
  }
  switch (creepMemory.state) {
    case "scouting":
      {
        let pos: RoomPosition | null = creepMemory.exitPosition
          ? new RoomPosition(creepMemory.exitPosition.x, creepMemory.exitPosition.y, creepMemory.exitPosition.room)
          : null;
        if (pos?.roomName !== scout.room.name) {
          performScouting(scout);
          pos = null;
        }
        if (!pos) {
          let dir: FIND_EXIT_TOP | FIND_EXIT_BOTTOM | FIND_EXIT_RIGHT | FIND_EXIT_LEFT = creepMemory.lastDirection;
          const reverseLastDirection = ((dir + 3) % 8) + 1;
          let tries = 10;
          do {
            dir = randomExit();
            tries--;
          } while (tries > 0 && (dir === reverseLastDirection || !(pos = scout.pos.findClosestByPath(dir))));
          if (!pos) {
            creepMemory.exitPosition = null;
            return;
          }
          creepMemory.lastDirection = dir;
          creepMemory.exitPosition = { x: pos.x, y: pos.y, room: pos.roomName };
        }
        scout.travelInto(pos, undefined, { reusePath: 100 });
      }
      break;
  }
}

function performScouting(creep: Scout) {
  const currentScoutData = segments.scoutData.get();
  let swampRatio = 0;
  let wallRatio = 0;
  let srcCtrlAvgDst = 0;
  {
    const previousData = currentScoutData[creep.room.name];
    if (previousData) {
      swampRatio = previousData.swampRatio;
      wallRatio = previousData.wallRatio;
      srcCtrlAvgDst = previousData.srcCtrlAvgDst;
    } else {
      const terrain = creep.room.getTerrain();
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          const tile = terrain.get(x, y);
          if (tile === TERRAIN_MASK_SWAMP) {
            swampRatio++;
          } else if (tile === TERRAIN_MASK_WALL) {
            wallRatio++;
          }
        }
      }
      swampRatio = swampRatio / (50 * 50);
      wallRatio = wallRatio / (50 * 50);

      const sourcesPos = sourcesAndMineral(creep.room, 1000).map(s => s.pos);
      const controller = creep.room.controller;
      if (!controller || sourcesPos.length === 0) {
        srcCtrlAvgDst = 100;
      } else {
        srcCtrlAvgDst =
          sourcesPos.reduce(
            (acc, s) =>
              acc +
              _.sum(
                creep.room.findPath(s, controller.pos, {
                  ignoreCreeps: true,
                  ignoreRoads: true,
                  ignoreDestructibleStructures: true,
                  maxRooms: 1,
                  swampCost: 1
                }),
                r => terrain.get(r.x, r.y) / 2 + 1
              ),
            0
          ) / sourcesPos.length;
      }
    }
  }

  const data: ScoutData = {
    tick: Game.time,
    ctrlLvl: creep.room.controller?.level ?? null,
    sources: sourcesAndMineral(creep.room, 1000).length,
    spawn:
      creep.room.find(FIND_CONSTRUCTION_SITES).filter(s => s.structureType === "spawn").length +
        creep.room.find(FIND_STRUCTURES).filter(s => s.structureType === "spawn").length >
      0,
    swampRatio,
    wallRatio,
    srcCtrlAvgDst,
    enemies: _.countBy(creep.room.find(FIND_HOSTILE_CREEPS), c => c.owner.username),
    enemyStructures: _.countBy(
      creep.room.find(FIND_HOSTILE_STRUCTURES).filter(s => s.structureType !== "powerBank"),
      s => s.owner?.username ?? "none"
    )
  };

  currentScoutData[creep.room.name] = data;
  segments.scoutData.commit();
}
