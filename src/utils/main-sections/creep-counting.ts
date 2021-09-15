import { CreepRoleMemory } from '../creeps/role-memory';

export type RoomCreepCounter = {
  overall: number;
  perRole: { [key: string]: number | undefined; }
};
export type CreepCounter = Map<string, RoomCreepCounter>;

export function wrapWithCount(loop: (creepCount: CreepCounter) => void): () => void {
  return () => {
    if (!Memory.creepIndex) {
      Memory.creepIndex = 0;
    }
    let creepCount: CreepCounter = new Map();
    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
      const creep = Game.creeps[name];
      if (!creep) {
        delete Memory.creeps[name];
      }
      else {
        let roomCount = creepCount.get(creep.room.name);
        if (!roomCount) {
          roomCount = { overall: 0, perRole: { } };
          creepCount.set(creep.room.name, roomCount);
        }
        roomCount.overall++;
        const creepMemory = Memory.creeps[name] as CreepRoleMemory;
        if (creepMemory.role && (creep.ticksToLive ?? 600) > 100) {
          roomCount.perRole[creepMemory.role] = (roomCount.perRole[creepMemory.role] ?? 0) + 1;
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
