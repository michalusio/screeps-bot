import { getPathFromCache } from "cache/path-cache";
import { sources } from "cache/source-cache";
import { mySpawns } from "cache/structure-cache";
import { Placement } from "./placement";

export const roadsBetweenSources: Placement = {
  name: "Roads between Sources",
  isPlaced: (room: Room) => {
    const spawns = mySpawns(room, 50);
    const sourcesList = sources(room, 1000);
    return sourcesList.every(source1 => {
      return sourcesList.every(source2 => {
        return (
          source1 === source2 ||
          getPathFromCache(source2, source1, room)
            .filter(pos => spawns.every(spawn => spawn.pos.getRangeTo(pos) > 4))
            .every(pos => pos.isEqualTo(source2) || pos.isEqualTo(source1) || pos.hasRoad())
        );
      });
    });
  },
  place: (room: Room) => {
    const sourcesList = sources(room, 1000);
    const spawns = mySpawns(room, 50);
    sourcesList.forEach(source1 => {
      sourcesList.forEach(source2 => {
        if (source1 === source2) return;
        getPathFromCache(source2, source1, room)
          .filter(pos => pos.isEmpty() && pos.canBuild() && spawns.every(s => pos.getRangeTo(s) > 4))
          .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      });
    });
  }
};
