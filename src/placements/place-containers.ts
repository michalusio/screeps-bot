import { sourcesAndMineral } from "cache/source-cache";
import { mySpawns, structures } from "cache/structure-cache";
import { Placement } from "./placement";

export const placeSourceContainers: Placement = {
  name: "Place Source Containers",
  isPlaced: (room: Room) => {
    const sourcesList = sourcesAndMineral(room, 1000).filter(
      s => s instanceof Source || s.pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_EXTRACTOR)
    );
    return structures(room, 10).filter(s => s.structureType === STRUCTURE_CONTAINER).length >= sourcesList.length;
  },
  place: (room: Room) => {
    placeSourceContainersFunc(room);
  }
};

export const placeControllerContainers: Placement = {
  name: "Place Controller Containers",
  isPlaced: (room: Room) => {
    const sourcesList = sourcesAndMineral(room, 1000).filter(
      s => s instanceof Source || s.pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_EXTRACTOR)
    );
    return structures(room, 10).filter(s => s.structureType === STRUCTURE_CONTAINER).length > sourcesList.length;
  },
  place: (room: Room) => {
    placeControllerContainerFunc(room);
  }
};

function placeControllerContainerFunc(room: Room): void {
  const controller = room.controller;
  if (!controller) return;
  const controllerPos = controller.pos;
  const containerPlaces = controller.pos
    .getAround(2)
    .filter(p => p.getRangeTo(controller) > 1)
    .map(p => {
      room.visual.circle(p, { fill: "transparent", radius: 0.5, stroke: "#ffffff", strokeWidth: 0.1 });
      return p;
    })
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

function placeSourceContainersFunc(room: Room): void {
  const sourcesList = sourcesAndMineral(room, 1000).filter(
    s => s instanceof Source || s.pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_EXTRACTOR)
  );
  const spawns = mySpawns(room);
  sourcesList.forEach(s => {
    const hasContainer =
      (s.pos.lookForAround(LOOK_STRUCTURES) ?? []).some(s => s.structure.structureType === STRUCTURE_CONTAINER) ||
      (s.pos.lookForAround(LOOK_CONSTRUCTION_SITES) ?? []).some(
        s => s.constructionSite.structureType === STRUCTURE_CONTAINER
      );
    if (hasContainer) return;
    const containerPlace = minBy(s.pos.getEmptyAround(), pos => _.sum(spawns, spawn => pos.getRangeTo(spawn)));
    if (
      containerPlace &&
      containerPlace
        .lookFor(LOOK_STRUCTURES)
        .filter(s => s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_ROAD).length === 0
    ) {
      containerPlace.createConstructionSite(STRUCTURE_CONTAINER);
    }
  });
}
