import { Placement } from "placements/placement";
import { cacheForRoomStruct } from "./cache-util";

export const structuresNotPlaced = cacheForRoomStruct<boolean, Placement>(
  "placements",
  (room, placement) => !placement.isPlaced(room),
  "name"
);
