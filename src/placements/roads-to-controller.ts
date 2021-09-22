import { getPathFromCache } from 'cache/path-cache';
import { Placement } from './placement';

export const roadsToController: Placement = {
  name: 'Roads to Controller',
  isPlaced: (room: Room) => {
    if (!room.controller) return true;
    const controller = room.controller;
    const spawns = room.find(FIND_MY_SPAWNS);
    return spawns.every(spawn => {
      return getPathFromCache(spawn, controller, room)
      .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(controller) || pos.hasRoad());
    });
  },
  place: (room: Room) => {
    if (!room.controller) return;
    const controller = room.controller;
    const spawns = room.find(FIND_MY_SPAWNS);
    spawns.forEach(spawn => {
      getPathFromCache(spawn, controller, room)
        .filter(pos => pos.isEmpty())
        .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
    });
  }
};
