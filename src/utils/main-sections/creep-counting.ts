import { RemoteMinerMemory } from 'jobs/remote-miner';

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
    Memory.roleCosts = {};
    let creepCount: CreepCounter = new Map();
    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
      const creep = Game.creeps[name];
      if (!creep) {
        delete Memory.creeps[name];
        continue;
      }
      const creepMemory = Memory.creeps[name] as CreepRoleMemory;
      const creepRoom = creepMemory.role === 'remoteminer' ? (creepMemory as RemoteMinerMemory).originRoom : creep.room.name;
      let roomCount = creepCount.get(creepRoom);
      if (!roomCount) {
        roomCount = { overall: 0, perRole: { } };
        creepCount.set(creepRoom, roomCount);
      }
      roomCount.overall++;

      if (creepMemory.role && (creep.ticksToLive ?? 600) > 100) {
        roomCount.perRole[creepMemory.role] = (roomCount.perRole[creepMemory.role] ?? 0) + 1;
      }
      if (creepMemory.newCreep) {
        creepMemory.newCreep = false;
        Memory.creepIndex++;
      }
    }

    loop(creepCount);
  }
}
