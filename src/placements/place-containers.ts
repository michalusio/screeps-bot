import { Placement } from './placement';

export const placeContainers: Placement = {
  name: 'Place Containers',
  isPlaced: (room: Room) => {
    return room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER }).length > 2;
  },
  place: (room: Room) => {
    placeControllerContainer(room);
    placeSourceContainers(room);
  }
}
function placeControllerContainer(room: Room): void {
  const controller = room.controller;
    if (!controller) return;
    const controllerPos = controller.pos;
    const containerPlaces = controller.pos.getAround(2).filter(p => p.getRangeTo(controller) > 1)
      .map(p => ([p, p.findInRange(FIND_STRUCTURES, 1).filter(s => s.structureType === STRUCTURE_ROAD).length]) as [RoomPosition, number])
      .filter(p => p[1] > 0);
    containerPlaces.forEach(p => room.visual.circle(p[0].x, p[0].y, { stroke: 'red' }));
    if (containerPlaces.some(p => p[0].lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER).length > 0)) return;
    const firstSortedPlace = _.min(containerPlaces.filter(([p]) => p.isEmpty()), ([p, roads]) => (p.x - controllerPos.x) * (p.x - controllerPos.x) + (p.y - controllerPos.y) * (p.y - controllerPos.y) - roads);
    firstSortedPlace[0].createConstructionSite(STRUCTURE_CONTAINER);
}

function placeSourceContainers(room: Room): void {
  const sources = room.find(FIND_SOURCES);
  const spawns = room.find(FIND_MY_SPAWNS);
  const preferredPositionSum = spawns.reduce((c, s) => [c[0]+s.pos.x, c[1]+s.pos.y] as [number, number], sources.reduce((c, s) => [c[0]+s.pos.x, c[1]+s.pos.y] as [number, number], [0, 0] as [number, number]));
  const preferredPosition = new RoomPosition(preferredPositionSum[0] / (spawns.length + sources.length), preferredPositionSum[1] / (spawns.length + sources.length), room.name);

  const alreadyPlaced = preferredPosition.getAround(2).flatMap(p => p.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER)).length;

  if (2 - alreadyPlaced <= 0) return;
  const containerPlaces = preferredPosition.getAround(2).filter(p => p.isEmpty() && p.findInRange(FIND_STRUCTURES, 1).filter(s => s.structureType === STRUCTURE_ROAD).length > 0);
  _.sample(containerPlaces, 2 - alreadyPlaced).forEach(p => p.createConstructionSite(STRUCTURE_CONTAINER));
}
