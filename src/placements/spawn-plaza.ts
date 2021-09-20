import { Placement } from './placement';

const range = _.range(-4, 5);

export const spawnPlaza: Placement = {
  name: 'Spawn Plaza',
  isPlaced: (room: Room) => {
    const positions = room.find(FIND_MY_SPAWNS).flatMap(s => {
      return range.flatMap(x => range.filter(y => ((x + y + 20) % 2) === 0).map(y => new RoomPosition(s.pos.x + x, s.pos.y + y, room.name)));
    });
    return positions.every(pos => !pos.isEmpty());
  },
  place: (room: Room) => {

    const positions = room.find(FIND_MY_SPAWNS).flatMap(s => {
      return range.flatMap(x => range.filter(y => ((x + y + 20) % 2) === 0).map(y => new RoomPosition(s.pos.x + x, s.pos.y + y, room.name)));
    });

    positions.filter(pos => pos.isEmpty()).forEach(p => p.createConstructionSite(STRUCTURE_ROAD));
  }
}
