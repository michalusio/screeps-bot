import { roleUtilities } from "jobs/role-utilities";
import { CreepRoleMemory } from "utils/creeps";
import { log } from "utils/log";

export function creepActions(): void {
  //
  const [creepsWithBehavior, creepsWithNoBehavior] = _.partition(
    _.map(Game.creeps, creep => [creep, creep.roleMemory] as [Creep, CreepRoleMemory]),
    ([, memory]) => memory.role && roleUtilities[memory.role]
  );

  creepsWithNoBehavior.forEach(([creep]) => log(`Creep ${creep.name} has no role or no behavior defined`));

  creepsWithBehavior
    .filter(([creep, memory]) => {
      if (creep.hitsMax / 2 > creep.hits && memory.role !== "defender") {
        creep.say("Bye Bye!");
        creep.suicide();
        return false;
      } else return true;
    })
    .filter(([creep]) => !creep.spawning)
    .forEach(([creep, memory]) => {
      try {
        roleUtilities[memory.role][2](creep);
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.stack);
          console.log(e.message);
        } else console.log(e);
      }
    });
  //*/
}
