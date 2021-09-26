import { getPathFromCache } from "cache/path-cache";
import { mySpawns } from "cache/structure-cache";
import { Placement } from "./placement";

export const roadsToController: Placement = {
  name: "Roads to Controller",
  isPlaced: (room: Room) => {
    if (!room.controller) return true;
    const controller = room.controller;
    return mySpawns(room, 50).every(spawn => {
      return getPathFromCache(spawn, controller, room)
        .filter(pos => pos.getRangeTo(spawn) > 4)
        .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(controller) || pos.hasRoad());
    });
  },
  place: (room: Room) => {
    if (!room.controller) return;
    const controller = room.controller;
    mySpawns(room, 50).forEach(spawn => {
      getPathFromCache(spawn, controller, room)
        .filter(pos => pos.getRangeTo(spawn) > 4)
        .filter(pos => pos.isEmpty())
        .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
    });
  }
};
