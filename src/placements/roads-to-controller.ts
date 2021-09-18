import { Placement } from './placement';

export const roadsToController: Placement = {
  name: 'Roads to Controller',
  isPlaced: (room: Room) => {
    if (!room.controller) return true;
    const controller = room.controller;
    const spawns = room.find(FIND_MY_SPAWNS);
    return spawns.every(spawn => {
      return spawn.pos.findPathTo(controller, { ignoreCreeps: true, ignoreRoads: true })
      .every(step => {
        const pos = new RoomPosition(step.x, step.y, room.name);
        return pos.hasRoad() || pos.isEqualTo(spawn) || pos.isEqualTo(controller);
      });
    });
  },
  place: (room: Room) => {
    if (!room.controller) return;
    const controller = room.controller;
    const spawns = room.find(FIND_MY_SPAWNS);
    spawns.forEach(spawn => {
      spawn.pos.findPathTo(controller, { ignoreCreeps: true, ignoreRoads: true })
        .forEach(step => {
          const pos = new RoomPosition(step.x, step.y, room.name);
          if (pos.isEmpty()) {
            pos.createConstructionSite(STRUCTURE_ROAD);
          }
        });
    });
  }
};
