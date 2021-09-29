import { mySpawns } from "cache/structure-cache";
import { checkerBoard, deltaAround, toRoomPositions } from "utils/positions";
import { Placement } from "./placement";

const rangeSize = 5;

export const spawnPlaza: Placement = {
  name: "Spawn Plaza",
  isPlaced: (room: Room) => {
    const positions = mySpawns(room, 50).flatMap(s =>
      toRoomPositions(checkerBoard(deltaAround(rangeSize, 1), true), s.pos)
    );
    return positions.every(pos => !pos.isEmpty() || !pos.canBuild());
  },
  place: (room: Room) => {
    const positions = mySpawns(room, 50).flatMap(s =>
      toRoomPositions(checkerBoard(deltaAround(rangeSize, 1), true), s.pos)
    );

    positions.filter(pos => pos.isEmpty() && pos.canBuild()).forEach(p => p.createConstructionSite(STRUCTURE_ROAD));
  }
};
