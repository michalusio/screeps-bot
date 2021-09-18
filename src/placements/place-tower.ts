import { log } from 'utils/log';

import { Placement } from './placement';

export const placeTower: Placement = {
  name: 'Place Tower',
  isPlaced: (room: Room) => {
    return room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER }).length > 0 || room.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType === STRUCTURE_TOWER }).length > 0;
  },
  place: (room: Room) => {
    const spawns = room.find(FIND_MY_SPAWNS);
    const allEmptyPositionsAroundSpawns = spawns.flatMap(spawn => spawn.pos.getAround(6).filter(p => p.isEmpty() && p.getRangeTo(spawn) >= 4));
    const allEmptyPositionsWithSpaceAroundAndRoad = allEmptyPositionsAroundSpawns
      .filter(p => p.findInRange(FIND_MY_STRUCTURES, 1).length === 0)
      .map(p => ([p, p.findInRange(FIND_STRUCTURES, 1, { filter: s => s.structureType === STRUCTURE_ROAD }).length]) as [RoomPosition, number])
      .filter(p => p[1] > 0);
    const towerPlace = _.min(allEmptyPositionsWithSpaceAroundAndRoad, ([p, roads]) => spawns.reduce((sum, s) => sum + p.getRangeTo(s), -roads))[0];
    if (!towerPlace) {
      log('Cannot find a place for a tower!');
    }
    else {
      towerPlace.createConstructionSite(STRUCTURE_TOWER);
    }
  }
}
