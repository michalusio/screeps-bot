import { roleUtilities } from "jobs/role-utilities";
import { log } from "utils/log";

export function creepActions(): void {
  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName];
    const creepMemory = creep.roleMemory;
    if (creepMemory.role && roleUtilities[creepMemory.role]) {
      if (creep.hitsMax / 2 > creep.hits && creepMemory.role !== "defender") {
        creep.say("Bye Bye!");
        creep.suicide();
        continue;
      }
      if (creep.spawning) continue;
      try {
        roleUtilities[creepMemory.role][2](creep);
      } catch (e) {
        if (e instanceof Error) {
          console.log(e.stack);
        } else console.log(e);
      }
    } else log(`Creep ${creepName} has no role or no behavior defined`);
  }
}
