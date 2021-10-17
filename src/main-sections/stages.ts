import { structuresNotPlaced } from "cache/stage-cache";
import { mySpawns } from "cache/structure-cache";
import { CIVILIZATION_MINIMUM_SPAWN_ENERGY, CIVILIZATION_STAGE_MODIFIER, PLACEMENT_CACHE_TIME } from "configs";
import { defenderBody, defenderMemory } from "jobs/defender";
import { minerBody, minerMemory } from "jobs/miner";
import { roleUtilities } from "jobs/role-utilities";
import { Placement } from "placements/placement";
import { Bootstrap, modes, RoleRequirements, Stage } from "utils/modes";

import { log } from "../utils/log";
import { CreepCounter, RoomCreepCounter } from "./creep-counting";

export function wrapWithStages(loop: (creepCount: CreepCounter) => void): (creepCount: CreepCounter) => void {
  return (creepCount: CreepCounter) => {
    Object.keys(Game.spawns).forEach(s => {
      const spawn = Game.spawns[s];
      const counter = creepCount.get(spawn.room.name);
      if (!counter || counter.overall === 0) {
        console.log(spawn.name);
        if (spawn.room.energyAvailable > 230 && !spawn.spawning) {
          if (spawn.room.find(FIND_HOSTILE_CREEPS).length > 0) {
            spawn.spawnCreepCached(defenderBody(spawn.room.energyAvailable), `defender-${Memory.creepIndex}`, {
              memory: { ...defenderMemory, newCreep: true }
            });
          } else {
            spawn.spawnCreepCached(minerBody(spawn.room.energyAvailable), `miner-${Memory.creepIndex}`, {
              memory: { ...minerMemory, newCreep: true }
            });
          }
        }
      }
    });
    creepCount.forEach((roomCounter, roomName) => {
      const room = Game.rooms[roomName];

      if (!mySpawns(room).length) return;

      if (!room.memory.mode) {
        room.memory.mode = Bootstrap.name;
      }
      if (!room.memory.wallRepairs) {
        room.memory.wallRepairs = false;
      }
      if (!room.memory.children) {
        room.memory.children = [];
      }
      if (!room.memory.orders) {
        room.memory.orders = {};
      }
      if (performSpawnOrders(room)) return;

      //
      const mode = modes[room.memory.mode];
      const stages = mode.stages(room);

      const stageIndex = getCurrentStageIndex(room, stages, roomCounter);

      if (mode.canLeave(room) && stageIndex === stages.length - 1) {
        const openModes = Object.keys(modes)
          .map(m => modes[m])
          .filter(m => m.name !== mode.name)
          .filter(mode => mode.canEnter(room));
        if (openModes.length === 0) {
          log(`Room ${room.name} cannot find an open mode to change to`);
        } else if (openModes.length > 1) {
          log(`Room ${room.name} has multiple open modes to change to`);
        } else {
          room.memory.mode = openModes[0].name;
          log(`Room ${room.name} changing to mode ${room.memory.mode}`);
        }
      }

      if (mySpawns(room).some(s => !s.spawning)) {
        const civLevel = (room.memory.civilizationLevel ?? 0) * 0.9 + stageIndex * 0.1;
        room.memory.civilizationLevel = Math.floor(civLevel * 100) / 100;
      }

      const [nextRequirements, placementsToPlace] = getNextStageDelta(stageIndex, room, stages, roomCounter);
      if (placementsToPlace.length > 0 && room.find(FIND_MY_CONSTRUCTION_SITES).length === 0) {
        placementsToPlace[0].place(room);
      }

      mySpawns(room)
        .filter(
          spawn =>
            !spawn.spawning &&
            spawn.room.energyAvailable >=
              Math.min(spawn.room.energyCapacityAvailable, civilizationEnergyLevel(room.memory?.civilizationLevel))
        )
        .forEach(spawn => spawnRequirement(spawn, nextRequirements));
      //*/
    });

    loop(creepCount);
  };
}

export function civilizationEnergyLevel(civilizationLevel: number | undefined): number {
  return (
    CIVILIZATION_MINIMUM_SPAWN_ENERGY + Math.floor(Math.max(0, civilizationLevel ?? 0) * CIVILIZATION_STAGE_MODIFIER)
  );
}

function spawnRequirement(spawn: StructureSpawn, requirements: RoleRequirements): void {
  let requiredRole = "";
  for (const role in requirements) {
    if (requirements[role] <= 0) {
      continue;
    }
    if (!roleUtilities[role]) {
      log(`No role utilities for ${role}`);
      return;
    }
    requiredRole = role;
    break;
  }

  if (!requiredRole) {
    return;
  }
  const body = roleUtilities[requiredRole][0](spawn.room.energyAvailable);
  body.length = Math.min(body.length, 50);

  const memory = roleUtilities[requiredRole][1];
  if (body.length) {
    const spawnCode = spawn.spawnCreepCached(body, `${requiredRole}-${Memory.creepIndex}`, {
      memory: { ...memory, newCreep: true }
    });
    if (spawnCode === OK) {
      requirements[requiredRole]--;
    } else log(`Encountered a problem with spawning a ${requiredRole}: ${spawnCode}`);
  }
}

function getCurrentStageIndex(room: Room, stages: Stage[], creepCount: RoomCreepCounter): number {
  let stageIndex = -1;
  for (const stage of stages) {
    for (const role in stage.roles) {
      if ((creepCount.perRole[role] ?? 0) < stage.roles[role]) {
        return stageIndex;
      }
    }
    for (const placement of stage.structures || []) {
      if (structuresNotPlaced(room, placement, PLACEMENT_CACHE_TIME)) return stageIndex;
    }
    stageIndex++;
  }
  return stageIndex;
}

const structureCache: { [room: string]: { [placement: string]: [boolean, number] } } = {};

function getNextStageDelta(
  stageIndex: number,
  room: Room,
  stages: Stage[],
  creepCount: RoomCreepCounter
): [RoleRequirements, Placement[]] {
  const nextStage = stages[stageIndex + 1];
  if (!nextStage) {
    return [{}, []];
  }
  const currentStage = stages[stageIndex]?.roles ?? {};
  const nextRequirements: RoleRequirements = {};
  for (const role in { ...currentStage, ...nextStage.roles }) {
    nextRequirements[role] = Math.max(0, (nextStage.roles[role] ?? 0) - (creepCount.perRole[role] ?? 0));
    if (nextRequirements[role] === 0) {
      delete nextRequirements[role];
    }
  }
  return [
    nextRequirements,
    (nextStage.structures || [])
      .map(
        s =>
          [s, ...((structureCache[room.name] ? structureCache[room.name][s.name] : [false, -1]) ?? [false, -1])] as [
            Placement,
            boolean,
            number
          ]
      )
      .filter(p => {
        if (Game.time - p[2] > PLACEMENT_CACHE_TIME) {
          p[2] = Game.time;
          p[1] = p[0].isPlaced(room);
          structureCache[room.name] = structureCache[room.name] || {};
          structureCache[room.name][p[0].name] = [p[1], p[2]];
        }
        return !p[1];
      })
      .map(p => p[0])
  ];
}

function performSpawnOrders(room: Room) {
  const orders = room.memory.orders;
  if (orders && Object.keys(orders).length > 0) {
    Object.keys(orders).forEach(orderRole => {
      if (orders[orderRole] === 0) {
        delete orders[orderRole];
      } else {
        mySpawns(room)
          .filter(spawn => !spawn.spawning && spawn.room.energyAvailable >= 300)
          .forEach(spawn => {
            const body = roleUtilities[orderRole][0](spawn.room.energyAvailable);
            body.length = Math.min(body.length, 50);
            if (!body.length) return;

            const memory = roleUtilities[orderRole][1];
            const spawnCode = spawn.spawnCreepCached(body, `${orderRole}-${Memory.creepIndex}`, {
              memory: { ...memory, newCreep: true }
            });
            if (spawnCode === OK) {
              orders[orderRole]--;
            }
          });
      }
    });
    return true;
  }
  return false;
}
