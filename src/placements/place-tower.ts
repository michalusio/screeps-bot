import { log } from 'utils/log';

import { Placement } from './placement';

export const placeTower: (n: number) => Placement = (n: number) => ({
  name: `Place Tower (${n})`,
  isPlaced: (room: Room) =>  room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER }).length >= n,
  place: (room: Room) => {
    const toTake = n - room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER }).length - room.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType === STRUCTURE_TOWER }).length;
    if (toTake > 0) {
      const spawns = room.find(FIND_MY_SPAWNS);
      const allEmptyPositionsAroundSpawns = spawns.flatMap(spawn => spawn.pos.getAround(6).filter(p => p.isEmpty() && p.getRangeTo(spawn) >= 4));
      const allEmptyPositionsWithSpaceAroundAndRoad = allEmptyPositionsAroundSpawns
        .filter(p => p.findInRange(FIND_MY_STRUCTURES, 1).length === 0)
        .map(p => ([p, p.findInRange(FIND_STRUCTURES, 1, { filter: s => s.structureType === STRUCTURE_ROAD }).length]) as [RoomPosition, number])
        .filter(p => p[1] > 0);
      const towerPlaces = _.sortBy(allEmptyPositionsWithSpaceAroundAndRoad, ([p, roads]) => spawns.reduce((sum, s) => sum + p.getRangeTo(s), -roads)).map(p => p[0]);
      if (towerPlaces.length === 0) {
        log('Cannot find a place for a tower!');
      }
      else {
        _.take(towerPlaces, toTake).forEach(towerPlace => towerPlace.createConstructionSite(STRUCTURE_TOWER));
      }
    }
  }
})
