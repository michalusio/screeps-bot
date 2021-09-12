import { roleUtilities } from 'jobs/role-utilities';

import { CreepCounter } from './creep-counting';

type Stage = { [key: string]: number; };
const stages: Stage[] = [
  { miner: 1, hauler: 1 },
  { miner: 2, hauler: 2, upgrader: 1 },
  { miner: 2, hauler: 2, upgrader: 1, defender: 1 },
  { miner: 2, hauler: 2, upgrader: 2, defender: 1, builder: 1 },
  { miner: 2, hauler: 2, upgrader: 2, defender: 1, builder: 2 },
  { miner: 2, hauler: 2, upgrader: 2, defender: 2, builder: 3 },
  { miner: 2, hauler: 2, upgrader: 2, defender: 2, builder: 3 },
]

export function wrapWithStages(loop: (creepCount: CreepCounter) => void): (creepCount: CreepCounter) => void {
  return (creepCount: CreepCounter) => {
    Memory.stageIndex = getCurrentStageIndex(creepCount);

    loop(creepCount);

    Memory.civilizationLevel = (Memory.civilizationLevel != null)
    ? (Memory.civilizationLevel + Memory.stageIndex) / 2
    : 0;
    Memory.civilizationLevel = Math.floor(Memory.civilizationLevel * 100) / 100;

    const nextRequirements = getNextStageDelta(Memory.stageIndex, creepCount);

    for (const spawns in Game.spawns) {
      const spawn = Game.spawns[spawns];
      if (!spawn.spawning && spawn.room.energyAvailable >= Math.max(spawn.room.energyCapacityAvailable, civilizationEnergyLevel())) {
        spawnRequirement(spawn, nextRequirements);
      }
    }
  }
}

export function civilizationEnergyLevel(): number {
  return 200 + Math.floor((Memory.civilizationLevel ?? 0) * 50);
}

function spawnRequirement(spawn: StructureSpawn, requirements: Stage): void {
  let requiredRole: string = '';
  for (const role in requirements) {
    if (requirements[role] <= 0) { continue; }
    if (!roleUtilities[role]) {
      console.log(`No role utilities for ${role}`);
      return;
    }
    requiredRole = role;
    break;
  }
  if (!requiredRole) { return; }
  const body = roleUtilities[requiredRole][0];
  const memory = roleUtilities[requiredRole][1];
  if (spawn.spawnCreep(body(spawn.room.energyAvailable), `${requiredRole}-${Memory.creepIndex}`, { memory }) === OK) {
    requirements[requiredRole]--;
  }
}

function getCurrentStageIndex(creepCount: CreepCounter): number {
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

function getNextStageDelta(stageIndex: number, creepCount: CreepCounter): Stage {
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
