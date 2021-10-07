import { mySpawns } from "cache/structure-cache";
import { Placement } from "./placement";

export const storage: Placement = {
  name: "Storage",
  isPlaced: (room: Room) => room.find(FIND_MY_STRUCTURES).filter(s => s.structureType === "storage").length > 0,
  place: (room: Room) => {
    const spawns = mySpawns(room);
    const storages =
      room.find(FIND_MY_STRUCTURES).filter(s => s.structureType === "storage").length +
      room.find(FIND_MY_CONSTRUCTION_SITES).filter(s => s.structureType === "storage").length;

    if (storages === 0) {
      spawns[0].pos.getDirected(TOP).createConstructionSite(STRUCTURE_STORAGE);
    }
  }
};

export const link: Placement = {
  name: "Link",
  isPlaced: (room: Room) => room.find(FIND_MY_STRUCTURES).filter(s => s.structureType === "link").length > 0,
  place: (room: Room) => {
    const spawns = mySpawns(room);
    const links =
      room.find(FIND_MY_STRUCTURES).filter(s => s.structureType === "link").length +
      room.find(FIND_MY_CONSTRUCTION_SITES).filter(s => s.structureType === "link").length;

    if (links === 0) {
      spawns[0].pos.getDirected(BOTTOM).createConstructionSite(STRUCTURE_LINK);
    }
  }
};
