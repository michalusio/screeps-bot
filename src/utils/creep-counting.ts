import { CreepRoleMemory } from './creep-role-memory';

export type CreepCounter = {
  overall: number;
  perRole: { [key: string]: number | undefined; }
}

export function wrapWithCount(loop: (creepCount: CreepCounter) => void): () => void {
  return () => {
    if (!Memory.creepIndex) {
      Memory.creepIndex = 0;
    }
    let creepCount: CreepCounter = { overall: 0, perRole: {} };
    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
      }
      else {
        creepCount.overall++;
        const creepMemory = Memory.creeps[name] as CreepRoleMemory;
        if (creepMemory.role) {
          creepCount.perRole[creepMemory.role] =
          (creepCount.perRole[creepMemory.role] ?? 0) + 1;
        }
        if (creepMemory.newCreep) {
          creepMemory.newCreep = false;
          Memory.creepIndex++;
        }
      }
    }

    loop(creepCount);
  }
}
