import { roleUtilities } from 'jobs/role-utilities';
import { logging } from 'utils/console-module';
import { CreepCounter, wrapWithCount } from 'utils/creep-counting';
import { CreepRoleMemory } from 'utils/creep-role-memory';
import { injectMethods } from 'utils/declares';
import { flagBuilding } from 'utils/flag-building';
import { log } from 'utils/log';
import { renewIfNotBusy } from 'utils/spawn-renewal';
import { wrapWithStages } from 'utils/stages';

injectMethods();

export const loop =
wrapWithCount(
  wrapWithStages(
    (creepCount: CreepCounter) =>
    {
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

      renewIfNotBusy();
      flagBuilding();
      logging(creepCount);
    }
  )
);

