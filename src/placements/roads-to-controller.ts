import { getPathFromCache } from "cache/path-cache";
import { mySpawns } from "cache/structure-cache";
import { SPAWN_ACTIVE_AREA } from "configs";
import { Placement } from "./placement";

export const roadsToController: Placement = {
  name: "Roads to Controller",
  isPlaced: (room: Room) => {
    if (!room.controller) return true;
    const controller = room.controller;
    return mySpawns(room).every(spawn => {
      return getPathFromCache(spawn, controller)
        .filter(pos => pos.getRangeTo(spawn) > SPAWN_ACTIVE_AREA - 1 && !pos.isBorderCell())
        .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(controller) || !pos.isEmpty());
    });
  },
  place: (room: Room) => {
    if (!room.controller) return;
    const controller = room.controller;
    mySpawns(room).forEach(spawn => {
      getPathFromCache(spawn, controller)
        .filter(pos => pos.getRangeTo(spawn) > SPAWN_ACTIVE_AREA - 1)
        .filter(pos => pos.isEmpty() && !pos.isBorderCell() && !pos.isEqualTo(spawn) && !pos.isEqualTo(controller))
        .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
    });
  }
};
