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
  name: `Extensions placer (${n})`,
  isPlaced: (room: Room) => (room.controller?.level ?? 0) >= extensionsToRcl[n] && room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === 'extension'}).length >= n,
  place: (room: Room) => {

    if ((room.controller?.level ?? 0) < extensionsToRcl[n]) return;
    const toTake = n - room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === 'extension'}).length - room.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType === 'extension'}).length;
    if (toTake > 0) {
      const range = _.range(-4, 5);
      const positions: {pos: RoomPosition, dist: number}[] = room.find(FIND_MY_SPAWNS)
        .flatMap(s => range
          .flatMap(x => range
            .filter(y => ((x + y + 20) % 2) === 1)
            .map(y => ({ pos: new RoomPosition(s.pos.x + x, s.pos.y + y, room.name), dist: x * x + y * y }))
          )
        )
        .filter(a => a.pos.isEmpty());
      positions.forEach(a => room.visual.circle(a.pos.x, a.pos.y, { stroke: 'red' }));

      log(`Placing ${toTake} extensions`);
      _.take(_.sortBy(positions, p => p.dist), toTake)
      .map(p => p.pos)
      .forEach(p => {
        p.createConstructionSite(STRUCTURE_EXTENSION);
      });
    }

  }
});
