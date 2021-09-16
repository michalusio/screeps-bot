import { log } from 'utils/log';

import { Placement } from './placement';

const extensionsToRcl = {
  [5]: 2,
  [10]: 3,
  [20]: 4,
  [30]: 5,
  [40]: 6,
  [50]: 7,
  [60]: 8,
}

export const extensionPlacer: (n: 5 | 10 | 20 | 30 | 40 | 50 | 60) => Placement = (n: 5 | 10 | 20 | 30 | 40 | 50 | 60) => ({
  isPlaced: (room: Room) => (room.controller?.level ?? 0) >= extensionsToRcl[n] && (room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === 'extension'}).length + room.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType === 'extension'}).length) >= n,
  place: (room: Room) => {
    const range = _.range(-4, 5);

    let positions: [RoomPosition, number][] = [];
    room.find(FIND_MY_SPAWNS).forEach(s => {
      positions.push(...range.flatMap(x => range.filter(y => ((x + y) % 2) === 1).map(y => [new RoomPosition(s.pos.x + x, s.pos.y + y, room.name), x * x + y * y] as [RoomPosition, number])));
    });

    positions = positions.filter(([pos]) => pos.isEmpty());

    const toTake = n - room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === 'extension'}).length - room.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType === 'extension'}).length;
    if (toTake > 0) {
      log(`Placing ${toTake} extensions`);
      _.take(_.sortBy(positions, p => p[1]), Math.max(0, toTake))
      .map(p => p[0])
      .forEach(p => p.createConstructionSite(STRUCTURE_EXTENSION));
    }

  }
});
