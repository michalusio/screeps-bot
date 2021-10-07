import { mySpawns } from "cache/structure-cache";
import { ROAD_PLAZA_SIZE } from "configs";
import { checkerBoard, deltaAround, toRoomPositions } from "utils/positions";
import { Placement } from "./placement";

export const spawnPlaza: Placement = {
  name: "Spawn Plaza",
  isPlaced: (room: Room) => {
    const positions = mySpawns(room).flatMap(s =>
      toRoomPositions(checkerBoard(deltaAround(ROAD_PLAZA_SIZE, 1), true), s.pos)
    );
    return positions.every(pos => !pos.isEmpty() || pos.isBorderCell());
  },
  place: (room: Room) => {
    const positions = mySpawns(room).flatMap(s =>
      toRoomPositions(checkerBoard(deltaAround(ROAD_PLAZA_SIZE, 1), true), s.pos)
    );
    positions
      .filter(pos => pos.isEmpty() && !pos.isBorderCell())
      .forEach(p => p.createConstructionSite(STRUCTURE_ROAD));
  }
};
