import { roleUtilities } from 'jobs/role-utilities';
import { CreepRoleMemory } from 'utils/creeps';
import { log } from 'utils/log';

export function creepActions(): void {
  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName];
    const creepMemory = creep.memory as CreepRoleMemory;
    if (creepMemory.role && roleUtilities[creepMemory.role]) {
      if (creep.hitsMax/2 > creep.hits && creepMemory.role !== 'defender') {
        creep.say("Bye Bye!");
        creep.suicide();
        continue;
      }
      if (creep.spawning) continue;
      if (!Memory.roleCosts[creepMemory.role]) {
        Memory.roleCosts[creepMemory.role] = 0;
      }
      const currentCpu = Game.cpu.getUsed();
      try {
        roleUtilities[creepMemory.role][2](creep);
      } catch (e) {
        log(`${e}`);
      }
      Memory.roleCosts[creepMemory.role] += Game.cpu.getUsed() - currentCpu;
    }
    else log(`Creep ${creepName} has no role or no behavior defined`);
  }
}
