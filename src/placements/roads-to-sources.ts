import { Placement } from './placement';

export const roadsToSources: Placement = {
  name: 'Roads to Sources',
  isPlaced: (room: Room) => {
    const spawns = room.find(FIND_MY_SPAWNS);
    return room.find(FIND_SOURCES).every(source => {
      return spawns.every(spawn => {
        return spawn.pos.findPathTo(source, { ignoreCreeps: true })
          .every(step => {
            const pos = new RoomPosition(step.x, step.y, room.name);
            return pos.hasRoad() || pos.isEqualTo(spawn) || pos.isEqualTo(source);
          });
      });
    })
  },
  place: (room: Room) => {
    const spawns = room.find(FIND_MY_SPAWNS);
    room.find(FIND_SOURCES).forEach(source => {
      spawns.forEach(spawn => {
        spawn.pos.findPathTo(source, { ignoreCreeps: true })
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
