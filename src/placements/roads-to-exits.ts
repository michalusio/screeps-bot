import { Placement } from './placement';

export const roadsToExits: Placement = {
  name: 'Roads to Exits',
  isPlaced: (room: Room) => {
    const nearestExits = room.find(FIND_MY_SPAWNS).flatMap(s =>
      [
        s.pos.findClosestByRange(FIND_EXIT_BOTTOM),
        s.pos.findClosestByRange(FIND_EXIT_TOP),
        s.pos.findClosestByRange(FIND_EXIT_LEFT),
        s.pos.findClosestByRange(FIND_EXIT_RIGHT)
      ]
      .filter(e => e != null)
      .map(e => ([s, e]) as [StructureSpawn, RoomPosition])
    );
    return nearestExits.every(([spawn, exit]) =>
      spawn.pos.findPathTo(exit, { ignoreCreeps: true, ignoreRoads: true })
        .map(step => new RoomPosition(step.x, step.y, room.name))
        .filter(pos => !pos.isBorderCell())
        .every(pos => pos.hasRoad() || pos.isEqualTo(spawn) || pos.isEqualTo(exit))
    );
  },
  place: (room: Room) => {
    const nearestExits = room.find(FIND_MY_SPAWNS).flatMap(s =>
      [
        s.pos.findClosestByRange(FIND_EXIT_BOTTOM),
        s.pos.findClosestByRange(FIND_EXIT_TOP),
        s.pos.findClosestByRange(FIND_EXIT_LEFT),
        s.pos.findClosestByRange(FIND_EXIT_RIGHT)
      ]
      .filter(e => e != null)
      .map(e => ([s, e]) as [StructureSpawn, RoomPosition])
    );
    nearestExits.forEach(([spawn, exit]) =>
      spawn.pos.findPathTo(exit, { ignoreCreeps: true, ignoreRoads: true })
        .map(step => new RoomPosition(step.x, step.y, room.name))
        .filter(pos => pos.isEmpty() && !pos.isBorderCell())
        .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD))
    );
  }
};
