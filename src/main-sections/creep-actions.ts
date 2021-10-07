import { ROLE_CPU_PRIORITY } from "configs";
import { roleUtilities } from "jobs/role-utilities";
import { CreepRoleMemory } from "utils/creeps";
import { log } from "utils/log";

export function creepActions(): { [role: string]: [number, number] } {
  //
  const [creepsWithBehavior, creepsWithNoBehavior] = _.partition(
    _.map(Game.creeps, creep => [creep, creep.roleMemory] as [Creep, CreepRoleMemory]),
    ([, memory]) => memory.role && roleUtilities[memory.role]
  );

  creepsWithNoBehavior.forEach(([creep]) => log(`Creep ${creep.name} has no role or no behavior defined`));

  const healthyCreeps = creepsWithBehavior.filter(([creep, memory]) => {
    if (creep.hitsMax / 2 > creep.hits && memory.role !== "defender" && memory.role !== "attacker") {
      creep.say("Bye Bye!");
      creep.suicide();
      return false;
    } else return true;
  });

  const notSpawningCreeps = healthyCreeps.filter(([creep]) => !creep.spawning);
  const creepsGroupedByRole = _.sortBy(
    _.groupBy(notSpawningCreeps, x => x[1].role),
    (x, role) => ROLE_CPU_PRIORITY[role ?? "none"]
  );

  const roleTime: { [role: string]: [number, number] } = {};

  for (const roleBundle of creepsGroupedByRole) {
    const cpu = Game.cpu.getUsed();
    roleBundle.forEach(([creep, memory]) => {
      try {
        roleUtilities[memory.role][2](creep);
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.stack);
          console.log(e.message);
        } else console.log(e);
      }
    });
    roleTime[roleBundle[0][1].role] = [roleBundle.length, Game.cpu.getUsed() - cpu];
  }
  return roleTime;
  //*/
}
