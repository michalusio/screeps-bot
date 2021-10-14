import { mySpawns } from "cache/structure-cache";
import { USABLE_SPAWN_AREA } from "configs";
import { EXTENSIONS_TO_RCL } from "../constants";
import { log } from "utils/log";
import { extensionStar } from "utils/structures/extension-star";

import { Placement } from "./placement";

export const extensionPlacer: (n: 5 | 10 | 20 | 30 | 40 | 50 | 60) => Placement = (
  n: 5 | 10 | 20 | 30 | 40 | 50 | 60
) => ({
  name: `Extensions placer (${n})`,
  isPlaced: (room: Room) =>
    (room.controller?.level ?? 0) >= EXTENSIONS_TO_RCL[n] &&
    room.find(FIND_MY_STRUCTURES).filter(s => s.structureType === "extension").length >= n,
  place: (room: Room) => {
    if ((room.controller?.level ?? 0) < EXTENSIONS_TO_RCL[n]) return;
    const toTake =
      n -
      room.find(FIND_MY_STRUCTURES).filter(s => s.structureType === "extension").length -
      room.find(FIND_MY_CONSTRUCTION_SITES).filter(s => s.structureType === "extension").length;

    if (toTake > 0) {
      const spawns = mySpawns(room);
      log(`Placing ${toTake} extensions`);
      const stars: RoomPosition[] = [];
      for (let x = 3; x < 47; x++) {
        for (let y = 3; y < 47; y++) {
          const pos = new RoomPosition(x, y, room.name);
          if (extensionStar.canPlaceAt(pos) && spawns.every(s => !s.pos.inRangeTo(pos, USABLE_SPAWN_AREA))) {
            stars.push(pos);
          }
        }
      }
      const starPosition = minBy(stars, pos => _.sum(spawns, s => pos.getRangeTo(s)));
      if (starPosition) {
        extensionStar.placeAt(starPosition);
      } else {
        console.log("No star position found");
      }
    }
  }
});
