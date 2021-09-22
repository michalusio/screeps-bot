import { getPathFromCache } from 'cache/path-cache';
import { Placement } from './placement';

export const roadsToSources: Placement = {
  name: 'Roads to Sources',
  isPlaced: (room: Room) => {
    const spawns = room.find(FIND_MY_SPAWNS);
    return room.find(FIND_SOURCES).every(source => {
      return spawns.every(spawn => {
        return getPathFromCache(spawn, source, room)
          .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(source) || pos.hasRoad());
      });
    })
  },
  place: (room: Room) => {
    const spawns = room.find(FIND_MY_SPAWNS);
    room.find(FIND_SOURCES).forEach(source => {
      spawns.forEach(spawn => {
        getPathFromCache(spawn, source, room)
          .filter(pos => pos.isEmpty())
          .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      });
    })
  }
};
