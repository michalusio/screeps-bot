import { getPathFromCache } from "cache/path-cache";
import { sources } from "cache/source-cache";
import { mySpawns } from "cache/structure-cache";
import { Placement } from "./placement";

export const roadsToSources: Placement = {
  name: "Roads to Sources",
  isPlaced: (room: Room) => {
    const spawns = mySpawns(room);
    return sources(room, 1000).every(source => {
      return spawns.every(spawn => {
        return getPathFromCache(spawn, source, { ignoreRoads: false })
          .filter(pos => !pos.isBorderCell())
          .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(source) || !pos.isEmpty());
      });
    });
  },
  place: (room: Room) => {
    const spawns = mySpawns(room);
    sources(room, 1000).forEach(source => {
      spawns.forEach(spawn => {
        getPathFromCache(spawn, source, { ignoreRoads: false })
          .filter(pos => pos.isEmpty() && !pos.isBorderCell() && !pos.isEqualTo(spawn) && !pos.isEqualTo(source))
          .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      });
    });
  }
};
