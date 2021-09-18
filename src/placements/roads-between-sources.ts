import { Placement } from './placement';

export const roadsBetweenSources: Placement = {
  name: 'Roads between Sources',
  isPlaced: (room: Room) => {
    const sources = room.find(FIND_SOURCES);
    return sources.every(source1 => {
      return sources.every(source2 => {
        return source1 === source2 || source2.pos.findPathTo(source1, { ignoreCreeps: true, ignoreRoads: true })
          .every(step => {
            const pos = new RoomPosition(step.x, step.y, room.name);
            return pos.hasRoad() || pos.isEqualTo(source2) || pos.isEqualTo(source1);
          });
      });
    })
  },
  place: (room: Room) => {
    const spawns = room.find(FIND_SOURCES);
    spawns.forEach(source1 => {
      spawns.forEach(source2 => {
        if (source1 === source2) return;
        source2.pos.findPathTo(source1, { ignoreCreeps: true, ignoreRoads: true })
          .forEach(step => {
            const pos = new RoomPosition(step.x, step.y, room.name);
            if (pos.isEmpty()) {
              pos.createConstructionSite(STRUCTURE_ROAD);
            }
          });
      });
    })
  }
};
