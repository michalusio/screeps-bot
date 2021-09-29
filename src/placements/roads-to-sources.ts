import { getPathFromCache } from "cache/path-cache";
import { sources } from "cache/source-cache";
import { mySpawns } from "cache/structure-cache";
import { Placement } from "./placement";

export const roadsToSources: Placement = {
  name: "Roads to Sources",
  isPlaced: (room: Room) => {
    const spawns = mySpawns(room, 50);
    return sources(room, 1000).every(source => {
      return spawns.every(spawn => {
        return getPathFromCache(spawn, source, room)
          .filter(pos => pos.getRangeTo(spawn) > 4)
          .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(source) || pos.hasRoad());
      });
    });
  },
  place: (room: Room) => {
    const spawns = mySpawns(room, 50);
    sources(room, 1000).forEach(source => {
      spawns.forEach(spawn => {
        getPathFromCache(spawn, source, room)
          .filter(pos => pos.getRangeTo(spawn) > 4)
          .filter(pos => pos.isEmpty() && pos.canBuild())
          .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      });
    });
  }
};
