export function getByIdOrNew<T>(id: Id<T> | undefined, getNew: () => T | undefined): T | undefined {
  return (id ? Game.getObjectById(id) : undefined) || getNew();
}

export function structuresToRepair(room: Room): AnyStructure[] {
  return room.find(FIND_STRUCTURES, { filter: (s) => s.hitsMax/2 > s.hits });
}

export function freeSpaceAround(pos: RoomPosition, room: Room): number {
  var fields = room.lookForAtArea(LOOK_TERRAIN, pos.y-1, pos.x-1, pos.y+1, pos.x+1, true);
  var creeps = room.lookForAtArea(LOOK_CREEPS, pos.y-1, pos.x-1, pos.y+1, pos.x+1, true);
  return 9-_.countBy( fields , f => f.terrain ).wall - creeps.length;
}
