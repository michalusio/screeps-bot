import { Placement } from "placements/placement";
import { cacheForRoomStruct } from "./cache-util";

export const structuresPlaced = cacheForRoomStruct<boolean, Placement>(
  (room, placement) => !placement.isPlaced(room),
  "name"
);
