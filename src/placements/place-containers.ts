import { sources } from "cache/source-cache";
import { mySpawns, structures } from "cache/structure-cache";
import { Placement } from "./placement";

export const placeContainers: Placement = {
  name: "Place Containers",
  isPlaced: (room: Room) => {
    return structures(room, 10).filter(s => s.structureType === STRUCTURE_CONTAINER).length > 2;
  },
  place: (room: Room) => {
    placeControllerContainer(room);
    placeSourceContainers(room);
  }
};

function placeControllerContainer(room: Room): void {
  const controller = room.controller;
  if (!controller) return;
  const controllerPos = controller.pos;
  const containerPlaces = controller.pos
    .getAround(2)
    .filter(p => p.getRangeTo(controller) > 1)
    .map(
      p =>
        [p, p.findInRange(FIND_STRUCTURES, 1).filter(s => s.structureType === STRUCTURE_ROAD).length] as [
          RoomPosition,
          number
        ]
    )
    .filter(p => p[1] > 0);
  containerPlaces.forEach(p => room.visual.circle(p[0].x, p[0].y, { stroke: "red" }));
  if (
    containerPlaces.some(
      p => p[0].lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER).length > 0
    )
  )
    return;
  const firstSortedPlace = minBy(
    containerPlaces.filter(([p]) => p.isEmpty()),
    ([p, roads]) =>
      (p.x - controllerPos.x) * (p.x - controllerPos.x) + (p.y - controllerPos.y) * (p.y - controllerPos.y) - roads
  ) ?? [controllerPos, 0];
  firstSortedPlace[0].createConstructionSite(STRUCTURE_CONTAINER);
}

function placeSourceContainers(room: Room): void {
  const sourcesList = sources(room, 1000);
  const spawns = mySpawns(room);
  sourcesList.forEach(s => {
    const containerPlace = minBy(s.pos.getEmptyAround(), pos => _.sum(spawns, spawn => pos.getRangeTo(spawn)));
    if (
      containerPlace &&
      containerPlace.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER).length === 0
    ) {
      containerPlace.createConstructionSite(STRUCTURE_CONTAINER);
    }
  });
}
