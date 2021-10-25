import { CreepRemoteMemory, CreepRoleMemory } from "utils/creeps";

export type RoomCreepCounter = {
  overall: number;
  perRole: { [key: string]: number | undefined };
};
export type CreepCounter = Map<string, RoomCreepCounter>;

export function wrapWithCount(loop: (creepCount: CreepCounter) => void): () => void {
  return () => {
    const creepCount: CreepCounter = new Map();

    const [maybeAliveCreeps, deadCreeps] = _.partition(
      _.map(
        Memory.creeps,
        (creepMemory, name) =>
          [name ? Game.creeps[name] : undefined, creepMemory, name ?? ""] as [
            Creep | undefined,
            CreepRoleMemory,
            string
          ]
      ),
      ([creep]) => creep != null
    );

    deadCreeps.forEach(([, , name]) => {
      delete Memory.creeps[name];
    });

    const aliveCreeps = maybeAliveCreeps as [Creep, CreepRoleMemory, string][];

    aliveCreeps
      .filter(([, memory]) => (memory as CreepRemoteMemory).originRoom === "")
      .forEach(([creep, memory]) => {
        (memory as CreepRemoteMemory).originRoom = creep.room.name;
      });

    aliveCreeps.forEach(([creep, memory]) => {
      const creepRoom = (memory as CreepRemoteMemory).originRoom ?? creep.room.name;
      let roomCount = creepCount.get(creepRoom);
      if (!roomCount) {
        roomCount = { overall: 0, perRole: {} };
        creepCount.set(creepRoom, roomCount);
      }
      roomCount.overall++;
      if (
        memory.role &&
        ((creep.ticksToLive ?? 600) > CREEP_SPAWN_TIME * creep.body.length + 12 || memory.role === "claimer")
      ) {
        roomCount.perRole[memory.role] = (roomCount.perRole[memory.role] ?? 0) + 1;
      }
    });

    aliveCreeps
      .filter(([, memory]) => memory.newCreep)
      .forEach(([, memory]) => {
        delete memory.newCreep;
        Memory.creepIndex++;
      });

    loop(creepCount);
  };
}
