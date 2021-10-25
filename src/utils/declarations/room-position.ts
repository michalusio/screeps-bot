import { TREATED_AS_FREE_TILE } from "configs";

declare global {
  interface RoomPosition {
    getFreeSpaceAround(): number;
    getEmptyAround(): RoomPosition[];
    getAround(range: number): RoomPosition[];
    getDirected(dir: DirectionConstant): RoomPosition;
    isBorderCell(): boolean;
    canBuild(): boolean;
    isEmpty(): boolean;
    hasRoad(): boolean;
    areEqual(pos: RoomPosition | undefined): boolean;
    _isEmpty?: boolean;
    _hasRoad?: boolean;
    _tick?: number;
  }
}

export function injectRoomPositionMethods(): void {
  if (!Memory.afterReset) return;

  RoomPosition.prototype.getFreeSpaceAround = function (): number {
    if (!Game.rooms[this.roomName]) {
      return -1;
    }

    const area = Game.rooms[this.roomName].lookAtArea(
      Math.max(0, this.y - 1),
      Math.max(0, this.x - 1),
      Math.min(49, this.y + 1),
      Math.min(49, this.x + 1),
      true
    );
    return 9 - _.sum(area, l => (l.terrain === "wall" || l.creep != null ? 1 : 0));
  };

  RoomPosition.prototype.areEqual = function (pos: RoomPosition | undefined): boolean {
    return pos != null && this.x === pos.x && this.y === pos.y && this.roomName === pos.roomName;
  };

  RoomPosition.prototype.getEmptyAround = function (): RoomPosition[] {
    if (!Game.rooms[this.roomName]) {
      return [];
    }

    return Game.rooms[this.roomName]
      .lookAtArea(
        Math.max(0, this.y - 1),
        Math.max(0, this.x - 1),
        Math.min(49, this.y + 1),
        Math.min(49, this.x + 1),
        true
      )
      .filter(l => (l.type === "terrain" && l.terrain !== "wall") || TREATED_AS_FREE_TILE.includes(l.type))
      .map(l => new RoomPosition(l.x, l.y, this.roomName));
  };

  RoomPosition.prototype.isEmpty = function (): boolean {
    if (this._tick ?? 0 < Game.time - 10) {
      this._tick = Game.time;
      this._isEmpty = undefined;
      this._hasRoad = undefined;
    }
    this._isEmpty =
      this._isEmpty ??
      this.look().every(l => (l.type === "terrain" && l.terrain !== "wall") || TREATED_AS_FREE_TILE.includes(l.type));
    return this._isEmpty;
  };

  RoomPosition.prototype.hasRoad = function (): boolean {
    if (this._tick ?? 0 < Game.time - 10) {
      this._tick = Game.time;
      this._isEmpty = undefined;
      this._hasRoad = undefined;
    }
    this._hasRoad =
      this._hasRoad ??
      (this._isEmpty !== false &&
        this.look().some(
          l =>
            (l.type === "structure" && l.structure?.structureType === STRUCTURE_ROAD) ||
            (l.type === "constructionSite" && l.constructionSite?.structureType === STRUCTURE_ROAD)
        ));
    return this._hasRoad;
  };

  RoomPosition.prototype.getAround = function (range: number): RoomPosition[] {
    const positions: RoomPosition[] = [];
    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        if (this.x + x >= 0 && this.x + x < 50 && this.y + y >= 0 && this.y + y < 50) {
          positions.push(new RoomPosition(this.x + x, this.y + y, this.roomName));
        }
      }
    }
    return positions;
  };

  RoomPosition.prototype.getDirected = function (dir: DirectionConstant): RoomPosition {
    let dirP: [number, number] = [0, 0];
    switch (dir) {
      case TOP:
        dirP = [0, -1];
        break;
      case TOP_RIGHT:
        dirP = [1, -1];
        break;
      case RIGHT:
        dirP = [1, 0];
        break;
      case BOTTOM_RIGHT:
        dirP = [1, 1];
        break;
      case BOTTOM:
        dirP = [0, 1];
        break;
      case BOTTOM_LEFT:
        dirP = [-1, 1];
        break;
      case LEFT:
        dirP = [-1, 0];
        break;
      case TOP_LEFT:
        dirP = [-1, -1];
        break;
    }
    return new RoomPosition(this.x + dirP[0], this.y + dirP[1], this.roomName);
  };

  RoomPosition.prototype.isBorderCell = function (): boolean {
    return this.x === 0 || this.x === 49 || this.y === 0 || this.y === 49;
  };

  RoomPosition.prototype.canBuild = function (): boolean {
    return this.x > 1 && this.x < 48 && this.y > 1 && this.y < 48;
  };
}
