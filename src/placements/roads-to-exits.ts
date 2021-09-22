import { getPathFromCache } from 'cache/path-cache';
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
      getPathFromCache(spawn, exit, room)
        .filter(pos => !pos.isBorderCell())
        .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(exit) || pos.hasRoad())
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
      getPathFromCache(spawn, exit, room)
        .filter(pos => pos.isEmpty() && !pos.isBorderCell())
        .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD))
    );
  }
};
