import { getPathFromCache } from "cache/path-cache";
import { mySpawns } from "cache/structure-cache";
import { Placement } from "./placement";

export const roadsToController: Placement = {
  name: "Roads to Controller",
  isPlaced: (room: Room) => {
    if (!room.controller) return true;
    const controller = room.controller;
    return mySpawns(room).every(spawn => {
      return getPathFromCache(spawn, controller, { ignoreRoads: false, ignoreContainers: false })
        .filter(pos => !pos.isBorderCell())
        .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(controller) || !pos.isEmpty());
    });
  },
  place: (room: Room) => {
    if (!room.controller) return;
    const controller = room.controller;
    mySpawns(room).forEach(spawn => {
      getPathFromCache(spawn, controller, { ignoreRoads: false, ignoreContainers: false })
        .filter(pos => pos.isEmpty() && !pos.isBorderCell() && !pos.isEqualTo(spawn) && !pos.isEqualTo(controller))
        .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
    });
  }
};
