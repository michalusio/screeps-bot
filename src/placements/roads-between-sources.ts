import { getPathFromCache } from "cache/path-cache";
import { sources } from "cache/source-cache";
import { mySpawns } from "cache/structure-cache";
import { SPAWN_ACTIVE_AREA } from "configs";
import { Placement } from "./placement";

export const roadsBetweenSources: Placement = {
  name: "Roads between Sources",
  isPlaced: (room: Room) => {
    const spawns = mySpawns(room);
    const sourcesList = sources(room, 1000);
    return sourcesList.every(source1 => {
      return sourcesList.every(source2 => {
        return (
          source1 === source2 ||
          getPathFromCache(source2, source1)
            .filter(pos => spawns.every(spawn => pos.getRangeTo(spawn) > SPAWN_ACTIVE_AREA - 1))
            .every(pos => pos.isEqualTo(source2) || pos.isEqualTo(source1) || !pos.isEmpty() || !pos.canBuild())
        );
      });
    });
  },
  place: (room: Room) => {
    const sourcesList = sources(room, 1000);
    const spawns = mySpawns(room);
    sourcesList.forEach(source1 => {
      sourcesList.forEach(source2 => {
        if (source1 === source2) return;
        getPathFromCache(source2, source1)
          .filter(pos => spawns.every(spawn => pos.getRangeTo(spawn) > SPAWN_ACTIVE_AREA - 1))
          .filter(pos => pos.isEmpty() && pos.canBuild() && !pos.isEqualTo(source2) && !pos.isEqualTo(source1))
          .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      });
    });
  }
};
