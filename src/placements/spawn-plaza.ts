import { log } from 'utils/log';

import { Placement } from './placement';

const range = _.range(-4, 5);

export const spawnPlaza: Placement = {
  name: 'Spawn Plaza',
  isPlaced: (room: Room) => {
    const positions = room.find(FIND_MY_SPAWNS).flatMap(s => {
      return range.flatMap(x => range.filter(y => ((x + y) % 2) === 0).map(y => new RoomPosition(s.pos.x + x, s.pos.y + y, room.name)));
    });
    return positions.every(pos => !pos.isEmpty());
  },
  place: (room: Room) => {

    const positions = room.find(FIND_MY_SPAWNS).flatMap(s => {
      return range.flatMap(x => range.filter(y => ((x + y) % 2) === 0).map(y => new RoomPosition(s.pos.x + x, s.pos.y + y, room.name)));
    });

    const toPlace = positions.filter(pos => pos.isEmpty());
    log(toPlace.join(','));

    toPlace.forEach(p => p.createConstructionSite(STRUCTURE_ROAD));
  }
}
