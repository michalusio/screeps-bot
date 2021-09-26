import { getPathFromCache } from "cache/path-cache";
import { mySpawns } from "cache/structure-cache";
import { Placement } from "./placement";

export const roadsToSources: Placement = {
  name: "Roads to Sources",
  isPlaced: (room: Room) => {
    const spawns = mySpawns(room, 50);
    return room.find(FIND_SOURCES).every(source => {
      return spawns.every(spawn => {
        return getPathFromCache(spawn, source, room)
          .filter(pos => pos.getRangeTo(spawn) > 4)
          .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(source) || pos.hasRoad());
      });
    });
  },
  place: (room: Room) => {
    const spawns = mySpawns(room, 50);
    room.find(FIND_SOURCES).forEach(source => {
      spawns.forEach(spawn => {
        getPathFromCache(spawn, source, room)
          .filter(pos => pos.getRangeTo(spawn) > 4)
          .filter(pos => pos.isEmpty())
          .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      });
    });
  }
};
