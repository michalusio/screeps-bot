import { roleUtilities } from 'jobs/role-utilities';
import { CreepCounter, wrapWithCount } from 'utils/creep-counting';
import { CreepRoleMemory } from 'utils/creep-role-memory';
import { ErrorMapper } from 'utils/ErrorMapper';
import { wrapWithStages } from 'utils/stages';

export const loop =
ErrorMapper.wrapLoop(
  wrapWithCount(
    wrapWithStages(
      (creepCount: CreepCounter) =>
      {
        for(const creepName in Game.creeps) {
          const creep = Game.creeps[creepName];
          const creepMemory = creep.memory as CreepRoleMemory;
          if (creepMemory.role && roleUtilities[creepMemory.role]) {
            roleUtilities[creepMemory.role][2](creep);
          }
          else console.log(`Creep ${creepName} has no role or no behavior defined`);
        }
      }
    )
  )
);

