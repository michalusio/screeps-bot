import { TREATED_AS_FREE_TILE } from "configs";

declare global {
  interface Room {
    createConstructionSiteIfEmpty(x: number, y: number, type: BuildableStructureConstant): ScreepsReturnCode;
    createConstructionSiteForced(x: number, y: number, type: BuildableStructureConstant): ScreepsReturnCode;
  }

  interface RoomMemory {
    civilizationLevel: number;
    orders: { [role: string]: number };
    wallRepairs: number;
    prioritizeBuilding: boolean;
    mode: string;
    children: string[];
    remotes: string[];
  }
}

export function injectRoomMethods(): void {
  if (!Memory.afterReset) return;

  Room.prototype.createConstructionSiteIfEmpty = function (
    x: number,
    y: number,
    structureType: BuildableStructureConstant
  ): ScreepsReturnCode {
    if (
      this.lookAt(x, y).every(
        l => (l.type === "terrain" && l.terrain !== "wall") || TREATED_AS_FREE_TILE.includes(l.type)
      )
    ) {
      return this.createConstructionSite(x, y, structureType);
    }
    return ERR_INVALID_TARGET;
  };

  Room.prototype.createConstructionSiteForced = function (
    x: number,
    y: number,
    structureType: BuildableStructureConstant
  ): ScreepsReturnCode {
    this.lookForAt(LOOK_STRUCTURES, x, y)
      .filter(s => s.structureType !== STRUCTURE_RAMPART)
      .forEach(s => s.destroy());
    this.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).forEach(s => s.remove());
    return this.createConstructionSite(x, y, structureType);
  };
}
