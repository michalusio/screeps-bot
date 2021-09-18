import { defenderBody, defenderMemory } from 'jobs/defender';
import { roleUtilities } from 'jobs/role-utilities';
import { extensionPlacer } from 'placements/extension-placement';
import { placeContainers } from 'placements/place-containers';
import { placeTower } from 'placements/place-tower';
import { Placement } from 'placements/placement';
import { roadsBetweenSources } from 'placements/roads-between-sources';
import { roadsToController } from 'placements/roads-to-controller';
import { roadsToExits } from 'placements/roads-to-exits';
import { roadsToSources } from 'placements/roads-to-sources';
import { spawnPlaza } from 'placements/spawn-plaza';

import { log } from '../log';
import { CreepCounter, RoomCreepCounter } from './creep-counting';

type RoleRequirements = { [key: string]: number; };

type Stage = { roles: RoleRequirements, structures?: Placement[] };

const stages: Stage[] = [
  { roles: { miner: 1, hauler: 1 } },
  { roles: { miner: 2, hauler: 2, upgrader: 1 } },
  { roles: { defender: 1 } },
  { roles: { upgrader: 2, builder: 1 }, structures: [extensionPlacer(5)] },
  { roles: { builder: 2, remoteminer: 3 }, structures: [roadsToSources, roadsBetweenSources] },
  { roles: { defender: 2, builder: 3, hauler: 3 }, structures: [roadsToController, spawnPlaza, extensionPlacer(10)] },
  { roles: { towerbro: 1, remoteminer: 5 }, structures: [placeContainers, placeTower] },
  { roles: { remoteminer: 8 }, structures: [roadsToExits, extensionPlacer(20)] },
]

export function wrapWithStages(loop: (creepCount: CreepCounter) => void): (creepCount: CreepCounter) => void {
  return (creepCount: CreepCounter) => {
    if (!Memory.civilizationLevel) {
      Memory.civilizationLevel = {};
    }

    if (creepCount.size === 0) {
      Object.keys(Game.spawns).forEach(s => {
        const spawn = Game.spawns[s]
        if (spawn.room.energyAvailable > 230 && !spawn.spawning) {
          spawn.spawnCreep(defenderBody(spawn.room.energyAvailable), `defender-${Memory.creepIndex}`, { memory: { ...defenderMemory, newCreep: true } })
        }
      });
    }

    creepCount.forEach((roomCounter, roomName) => {
      const room = Game.rooms[roomName];

      if (performOrders(room)) return;

      const stageIndex = getCurrentStageIndex(room, roomCounter);

      const civLevel = (Memory.civilizationLevel[roomName] ?? 0) * 0.9 + stageIndex * 0.1;
      Memory.civilizationLevel[roomName] = Math.floor(civLevel * 100) / 100;

      const [nextRequirements, placementsToPlace] = getNextStageDelta(stageIndex, room, roomCounter);

      if (placementsToPlace.length > 0 && room.find(FIND_MY_CONSTRUCTION_SITES).length === 0) {
        _.first(placementsToPlace).place(room);
      }

      room
        .find(FIND_MY_SPAWNS)
        .filter(spawn => !spawn.spawning && spawn.room.energyAvailable >= Math.min(spawn.room.energyCapacityAvailable, civilizationEnergyLevel(roomName)))
        .forEach(spawn => spawnRequirement(spawn, nextRequirements));
    });

    loop(creepCount);
  }
}

export function civilizationEnergyLevel(roomName: string): number {
  return Math.max(150, 150 + Math.floor((Memory.civilizationLevel[roomName] ?? 0) * 50));
}

function spawnRequirement(spawn: StructureSpawn, requirements: RoleRequirements): void {
  let requiredRole: string = '';
  for (const role in requirements) {
    if (requirements[role] <= 0) { continue; }
    if (!roleUtilities[role]) {
      log(`No role utilities for ${role}`);
      return;
    }
    requiredRole = role;
    break;
  }

  if (!requiredRole) { return; }
  const body = roleUtilities[requiredRole][0](spawn.room.energyAvailable);
  body.length = Math.min(body.length, 50);

  const memory = roleUtilities[requiredRole][1];
  if (body.length) {
    const spawnCode = spawn.spawnCreep(body, `${requiredRole}-${Memory.creepIndex}`, { memory: { ...memory, newCreep: true } });
    if (spawnCode === OK) {
      requirements[requiredRole]--;
    }
    else log(`Encountered a problem with spawning a ${requiredRole}: ${spawnCode}`);
  }
}

function getCurrentStageIndex(room: Room, creepCount: RoomCreepCounter): number {
  let stageIndex = -1;
  for (const stage of stages) {
    for (const role in stage.roles) {
      if ((creepCount.perRole[role] ?? 0) < stage.roles[role]) {
        return stageIndex;
      }
    }
    for (const placement of (stage.structures || [])) {
      if (!placement.isPlaced(room)) return stageIndex;
    }
    stageIndex++;
  }
  return stageIndex;
}

function getNextStageDelta(stageIndex: number, room: Room, creepCount: RoomCreepCounter): [RoleRequirements, Placement[]] {
  const nextStage = stages[stageIndex + 1];
  if (!nextStage) {
    return [{}, []];
  }
  const currentStage = stages[stageIndex]?.roles ?? {};
  const nextRequirements: RoleRequirements = {};
  for (const role in {...currentStage, ...nextStage.roles}) {
    nextRequirements[role] = Math.max(0, (nextStage.roles[role] ?? 0) - (creepCount.perRole[role] ?? 0));
  }
  return [nextRequirements, (nextStage.structures || []).filter(p => !p.isPlaced(room))];
}

function performOrders(room: Room) {
  if (Memory.orders[room.name]) {
    Object.keys(Memory.orders[room.name]).forEach(orderRole => {
      if (Memory.orders[room.name][orderRole] === 0) {
        delete Memory.orders[room.name][orderRole];
      }
      else {
        room
        .find(FIND_MY_SPAWNS)
        .filter(spawn => !spawn.spawning && spawn.room.energyAvailable >= 300)
        .forEach(spawn => {
          const body = roleUtilities[orderRole][0](spawn.room.energyAvailable);
          body.length = Math.min(body.length, 50);
          if (!body.length) return;

          const memory = roleUtilities[orderRole][1];
          const spawnCode = spawn.spawnCreep(body, `${orderRole}-${Memory.creepIndex}`, { memory: { ...memory, newCreep: true } });
          if (spawnCode === OK) {
            Memory.orders[room.name][orderRole]--;
          }
        });
      }
    });
    if (Object.keys(Memory.orders[room.name]).length === 0) {
      delete Memory.orders[room.name];
    }
    return true;
  }
  return false;
}

