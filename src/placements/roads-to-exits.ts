import { directionExitsFromSpawn, getPathFromCache } from "cache/path-cache";
import { Placement } from "./placement";

export const roadsToExits: Placement = {
  name: "Roads to Exits",
  isPlaced: (room: Room) => {
    const nearestExits = directionExitsFromSpawn(room, 500);
    return nearestExits.every(([spawn, exit]) => {
      return getPathFromCache(spawn, exit, { ignoreRoads: false, moveModifier: 0 })
        .filter(pos => !pos.isBorderCell())
        .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(exit) || pos.hasRoad() || !pos.isEmpty());
    });
  },
  place: (room: Room) => {
    const nearestExits = directionExitsFromSpawn(room, 500);
    nearestExits.forEach(([spawn, exit]) =>
      getPathFromCache(spawn, exit, { ignoreRoads: false, moveModifier: 0 })
        .filter(pos => pos.isEmpty() && !pos.isBorderCell())
        .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD))
    );
  }
};
