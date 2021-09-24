import { civilizationEnergyLevel } from "./stages";

export function renewIfNotBusy(): void {
  for (const spawnName in Game.spawns) {
    const spawn = Game.spawns[spawnName];
    if (spawn.spawning) {
      continue;
    }
    const nearestCreep = spawn.pos.findInRange(FIND_MY_CREEPS, 1);
    for (const creep of nearestCreep) {
      if (
        creep.roleMemory.role === "sacrifice" ||
        ((creep.ticksToLive ?? 600) < 100 && creep.store.getUsedCapacity() === 0)
      ) {
        spawn.recycleCreep(creep);
        break;
      }
      if (costOf(creep) < Math.min(spawn.room.energyCapacityAvailable, civilizationEnergyLevel(spawn.room)) / 2) {
        continue;
      }
      if ((creep.ticksToLive ?? 1000) < 1000 && (600 / creep.body.length) % 1 < 0.3 && spawn.renewCreep(creep) === OK)
        break;
    }
  }
}

export function costOf(creep: Creep): number {
  return _.sum(creep.body.map(bodyPart => BODYPART_COST[bodyPart.type]));
}
