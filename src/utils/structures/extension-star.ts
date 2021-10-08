import { mySpawns } from "cache/structure-cache";

export const extensionStar = {
  canPlaceAt(pos: RoomPosition): boolean {
    if (pos.x < 3 || pos.y < 3 || pos.x > 46 || pos.y > 46) return false;
    if ((Math.abs(pos.x) + Math.abs(pos.y)) % 2 === 1) return false;
    const room = Game.rooms[pos.roomName];
    const spawns = mySpawns(room);
    if (spawns.some(s => s.pos.inRangeTo(pos, 1))) return false;
    return room
      .lookAtArea(
        Math.max(0, pos.y - 1),
        Math.max(0, pos.x - 1),
        Math.min(49, pos.y + 1),
        Math.min(49, pos.x + 1),
        true
      )
      .every(
        t =>
          (t.type === "terrain" && t.terrain !== "wall") ||
          (t.type === "structure" && t.structure?.structureType === "road") ||
          t.type === "energy" ||
          t.type === "flag" ||
          t.type === "resource" ||
          t.type === "ruin" ||
          t.type === "tombstone" ||
          t.type === "creep" ||
          t.type === "powerCreep"
      );
  },
  placeAt(pos: RoomPosition): void {
    const room = Game.rooms[pos.roomName];
    room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
    room.createConstructionSite(pos.x - 1, pos.y, STRUCTURE_EXTENSION);
    room.createConstructionSite(pos.x, pos.y - 1, STRUCTURE_EXTENSION);
    room.createConstructionSite(pos.x + 1, pos.y, STRUCTURE_EXTENSION);
    room.createConstructionSite(pos.x, pos.y + 1, STRUCTURE_EXTENSION);

    room.createConstructionSite(pos.x - 1, pos.y - 1, STRUCTURE_ROAD);
    room.createConstructionSite(pos.x - 1, pos.y + 1, STRUCTURE_ROAD);
    room.createConstructionSite(pos.x + 1, pos.y - 1, STRUCTURE_ROAD);
    room.createConstructionSite(pos.x + 1, pos.y + 1, STRUCTURE_ROAD);

    room.createConstructionSite(pos.x - 2, pos.y, STRUCTURE_ROAD);
    room.createConstructionSite(pos.x, pos.y - 2, STRUCTURE_ROAD);
    room.createConstructionSite(pos.x + 2, pos.y, STRUCTURE_ROAD);
    room.createConstructionSite(pos.x, pos.y + 2, STRUCTURE_ROAD);
  }
};
