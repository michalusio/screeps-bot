import { getPathFromCache } from "cache/path-cache";
import { sourcesAndMineral } from "cache/source-cache";
import { mySpawns } from "cache/structure-cache";
import { Placement } from "./placement";

export const roadsToSources: Placement = {
  name: "Roads to Sources",
  isPlaced: (room: Room) => {
    const spawns = mySpawns(room);
    return sourcesAndMineral(room, 1000)
      .filter(
        s => s instanceof Source || s.pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_EXTRACTOR)
      )
      .every(source => {
        return spawns.every(spawn => {
          return getPathFromCache(spawn, source, { ignoreRoads: false })
            .filter(pos => !pos.isBorderCell())
            .every(pos => pos.isEqualTo(spawn) || pos.isEqualTo(source) || !pos.isEmpty());
        });
      });
  },
  place: (room: Room) => {
    const spawns = mySpawns(room);
    sourcesAndMineral(room, 1000)
      .filter(
        s => s instanceof Source || s.pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_EXTRACTOR)
      )
      .forEach(source => {
        spawns.forEach(spawn => {
          getPathFromCache(spawn, source, { ignoreRoads: false })
            .filter(pos => pos.isEmpty() && !pos.isBorderCell() && !pos.isEqualTo(spawn) && !pos.isEqualTo(source))
            .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
        });
      });
  }
};
