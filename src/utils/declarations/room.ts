import { TREATED_AS_FREE_TILE } from "configs";

declare global {
  interface Room {
    getRoomNameOnSide(side: ExitConstant): string | null;
    createConstructionSiteIfEmpty(x: number, y: number, type: BuildableStructureConstant): ScreepsReturnCode;
    createConstructionSiteForced(x: number, y: number, type: BuildableStructureConstant): ScreepsReturnCode;
  }
}

export function injectRoomMethods(): void {
  if (!Memory.afterReset) return;

  Room.prototype.getRoomNameOnSide = function (side: ExitConstant): string | null {
    return global.getRoomNameOnSide(this.name, side);
  };

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
    this.lookForAt(LOOK_STRUCTURES, x, y).forEach(s => s.destroy());
    this.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).forEach(s => s.remove());
    return this.createConstructionSite(x, y, structureType);
  };
}
