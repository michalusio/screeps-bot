import { roleUtilities } from 'jobs/role-utilities';
import { extensionPlacer } from 'placements/extension-placement';
import { Placement } from 'placements/placement';
import { roadsToController } from 'placements/roads-to-controller';
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
  { roles: { builder: 2 }, structures: [roadsToSources] },
  { roles: { defender: 2, hauler: 3 }, structures: [roadsToController, spawnPlaza, extensionPlacer(20)] },
  { roles: { towerbro: 1, remoteminer: 3 } },
]

export function wrapWithStages(loop: (creepCount: CreepCounter) => void): (creepCount: CreepCounter) => void {
  return (creepCount: CreepCounter) => {
    if (!Memory.civilizationLevel) {
      Memory.civilizationLevel = {};
    }
    creepCount.forEach((roomCounter, roomName) => {
      const room = Game.rooms[roomName];

      const stageIndex = getCurrentStageIndex(room, roomCounter);

      const civLevel = (Memory.civilizationLevel[roomName] ?? 0) * 0.9 + stageIndex * 0.1;
      Memory.civilizationLevel[roomName] = Math.floor(civLevel * 100) / 100;

      const [nextRequirements, placementsToPlace] = getNextStageDelta(stageIndex, room, roomCounter);

      if (placementsToPlace.length > 0) {
        if (room.find(FIND_MY_CONSTRUCTION_SITES).length === 0) {
          log(_.first(placementsToPlace).name);
          _.first(placementsToPlace).place(room);
        }
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
  return 150 + Math.floor((Memory.civilizationLevel[roomName] ?? 0) * 50);
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

  const spawnCode = spawn.spawnCreep(body, `${requiredRole}-${Memory.creepIndex}`, { memory: { ...memory, newCreep: true } });
  if (spawnCode === OK) {
    requirements[requiredRole]--;
  }
  else log(`Encountered a problem with spawning a ${requiredRole}: ${spawnCode}`);
}

function getCurrentStageIndex(room: Room, creepCount: RoomCreepCounter): number {
  let stageIndex = -1;
  for (const stage of stages) {
    for (const role in stage.roles) {
      if ((creepCount.perRole[role] ?? 0) < stage.roles[role]) {
        return stageIndex;
      }
    }
    let index = 0;
    for (const placement of (stage.structures || [])) {
      if (Game.time % 10 === index && !placement.isPlaced(room)) return stageIndex;
      index = (index + 1) % 10;
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
