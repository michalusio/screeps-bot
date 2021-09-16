export function getByIdOrNew<T>(id: Id<T> | undefined, getNew: () => T | undefined): T | undefined {
  return (id ? Game.getObjectById(id) : undefined) || getNew();
}

const structuresToRepairCache: { [roomName: string]: [AnyStructure[], number] } = {};

export function structuresToRepair(room: Room): AnyStructure[] {
  if (!structuresToRepairCache[room.name] || structuresToRepairCache[room.name][1] !== Game.time) {
    structuresToRepairCache[room.name] = [
      room.find(FIND_STRUCTURES, { filter: (s) => (s.structureType !== 'constructedWall' && s.structureType !== 'rampart' && s.hitsMax/2 > s.hits) || s.hits/100 > s.hits }),
      Game.time
    ];
  }
  return structuresToRepairCache[room.name][0];
}

export function freeSpaceAround(pos: RoomPosition, room: Room): number {
  var fields = room.lookForAtArea(LOOK_TERRAIN, pos.y-1, pos.x-1, pos.y+1, pos.x+1, true);
  var creeps = room.lookForAtArea(LOOK_CREEPS, pos.y-1, pos.x-1, pos.y+1, pos.x+1, true);
  return 9-_.countBy(fields , f => f.terrain).wall - creeps.length;
}
