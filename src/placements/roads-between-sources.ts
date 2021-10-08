import { getPathFromCache } from "cache/path-cache";
import { sources } from "cache/source-cache";
import { Placement } from "./placement";

export const roadsBetweenSources: Placement = {
  name: "Roads between Sources",
  isPlaced: (room: Room) => {
    const sourcesList = sources(room, 1000);
    return sourcesList.every(source1 => {
      return sourcesList.every(source2 => {
        return (
          source1 === source2 ||
          getPathFromCache(source2, source1).every(
            pos => pos.isEqualTo(source2) || pos.isEqualTo(source1) || !pos.isEmpty() || !pos.canBuild()
          )
        );
      });
    });
  },
  place: (room: Room) => {
    const sourcesList = sources(room, 1000);
    sourcesList.forEach(source1 => {
      sourcesList.forEach(source2 => {
        if (source1 === source2) return;
        getPathFromCache(source2, source1)
          .filter(pos => pos.isEmpty() && pos.canBuild() && !pos.isEqualTo(source2) && !pos.isEqualTo(source1))
          .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      });
    });
  }
};
