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
      try {
        let currentState = '';
        while(creepMemory.state !== currentState) {
          currentState = creepMemory.state;
          roleUtilities[creepMemory.role][2](creep);
        }
      } catch (e) {
        log(`${e}`);
      }
    }
    else log(`Creep ${creepName} has no role or no behavior defined`);
  }
}
