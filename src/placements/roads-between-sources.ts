import { getPathFromCache } from 'cache/path-cache';
import { Placement } from './placement';



export const roadsBetweenSources: Placement = {
  name: 'Roads between Sources',
  isPlaced: (room: Room) => {
    const sources = room.find(FIND_SOURCES);
    return sources.every(source1 => {
      return sources.every(source2 => {
        return source1 === source2 || getPathFromCache(source2, source1, room)
          .every(pos => pos.isEqualTo(source2) || pos.isEqualTo(source1) || pos.hasRoad());
      });
    })
  },
  place: (room: Room) => {
    const spawns = room.find(FIND_SOURCES);
    spawns.forEach(source1 => {
      spawns.forEach(source2 => {
        if (source1 === source2) return;
        getPathFromCache(source2, source1, room)
          .filter(pos => pos.isEmpty())
          .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      });
    })
  }
};
