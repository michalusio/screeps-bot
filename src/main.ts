import { roleUtilities } from 'jobs/role-utilities';
import { logging } from 'utils/console-module';
import { CreepCounter, wrapWithCount } from 'utils/creep-counting';
import { CreepRoleMemory } from 'utils/creep-role-memory';
import { flagBuilding } from 'utils/flag-building';
import { renewIfNotBusy } from 'utils/spawn-renewal';
import { wrapWithStages } from 'utils/stages';

export const loop =
wrapWithCount(
  wrapWithStages(
    (creepCount: CreepCounter) =>
    {
      for (const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];
        const creepMemory = creep.memory as CreepRoleMemory;
        if (creepMemory.role && roleUtilities[creepMemory.role]) {
          try {
          roleUtilities[creepMemory.role][2](creep);
          } catch (e) {
            console.log(e);
          }
        }
        else console.log(`Creep ${creepName} has no role or no behavior defined`);
      }

      renewIfNotBusy();
      flagBuilding();
      logging(creepCount);
    }
  )
);

