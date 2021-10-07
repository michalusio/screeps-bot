import { directionExitsFromSpawn, getPathFromCache } from "cache/path-cache";
import { SPAWN_ACTIVE_AREA } from "configs";
import { Placement } from "./placement";

export const roadsToExits: Placement = {
  name: "Roads to Exits",
  isPlaced: (room: Room) => {
    const nearestExits = directionExitsFromSpawn(room, 50);
    return nearestExits.every(([spawn, exit]) =>
      getPathFromCache(spawn, exit)
        .filter(pos => pos.getRangeTo(spawn) > SPAWN_ACTIVE_AREA - 1 && !pos.isBorderCell())
        .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(exit) || pos.hasRoad() || !pos.isEmpty())
    );
  },
  place: (room: Room) => {
    const nearestExits = directionExitsFromSpawn(room, 50);
    nearestExits.forEach(([spawn, exit]) =>
      getPathFromCache(spawn, exit)
        .filter(pos => pos.getRangeTo(spawn) > SPAWN_ACTIVE_AREA - 1)
        .filter(pos => pos.isEmpty() && !pos.isBorderCell())
        .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD))
    );
  }
};
