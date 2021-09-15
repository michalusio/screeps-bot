import { roleUtilities } from 'jobs/role-utilities';

import { log } from '../log';
import { CreepCounter, RoomCreepCounter } from './creep-counting';

type Stage = { [key: string]: number; };
const stages: Stage[] = [
  { miner: 1, hauler: 1 },
  { miner: 2, hauler: 2, upgrader: 1 },
  { miner: 2, hauler: 2, upgrader: 1, defender: 1 },
  { miner: 2, hauler: 2, upgrader: 2, defender: 1, builder: 1 },
  { miner: 3, hauler: 2, upgrader: 2, defender: 1, builder: 3 },
  { miner: 3, hauler: 3, upgrader: 2, defender: 2, builder: 3 },
  { miner: 3, hauler: 3, upgrader: 3, defender: 2, builder: 3, towerbro: 1 },
]

export function wrapWithStages(loop: (creepCount: CreepCounter) => void): (creepCount: CreepCounter) => void {
  return (creepCount: CreepCounter) => {
    if (!Memory.civilizationLevel) {
      Memory.civilizationLevel = {};
    }
    creepCount.forEach((roomCounter, roomName) => {
      const stageIndex = getCurrentStageIndex(roomCounter);

      const civLevel = ((Memory.civilizationLevel[roomName] ?? 0) + stageIndex) / 2;
      Memory.civilizationLevel[roomName] = Math.floor(civLevel * 100) / 100;

      const nextRequirements = getNextStageDelta(stageIndex, roomCounter);

      Game.rooms[roomName]
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

function spawnRequirement(spawn: StructureSpawn, requirements: Stage): void {
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

function getCurrentStageIndex(creepCount: RoomCreepCounter): number {
  let stageIndex = -1;
  for (const stage of stages) {
    for (const role in stage) {
      if ((creepCount.perRole[role] ?? 0) < stage[role]) {
        return stageIndex;
      }
    }
    stageIndex++;
  }
  return stageIndex;
}

function getNextStageDelta(stageIndex: number, creepCount: RoomCreepCounter): Stage {
  const nextStage = stages[stageIndex + 1];
  if (!nextStage) {
    return {};
  }
  const currentStage = stages[stageIndex] ?? {};
  const nextRequirements: Stage = {};
  for (const role in {...currentStage, ...nextStage}) {
    nextRequirements[role] = Math.max(0, (nextStage[role] ?? 0) - (creepCount.perRole[role] ?? 0));
  }
  return nextRequirements;
}
