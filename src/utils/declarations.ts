import { CreepRoleMemory } from './creeps/role-memory';

declare global {
  interface Memory {
    creepIndex?: number;
    civilizationLevel: { [roomName: string]: number };
  }

  interface Creep {
    roleMemory: CreepRoleMemory;
    wander(): CreepMoveReturnCode;
  }

  interface RoomPosition {
    getAround(range: number): RoomPosition[];
    getDirected(dir: DirectionConstant): RoomPosition;
    isBorderCell(): boolean;
    isEmpty(): boolean;
  }
}

export function injectMethods(): void {
  RoomPosition.prototype.isEmpty = function(): boolean {
    return this.look().every(l => l.type === 'terrain');
  }

  RoomPosition.prototype.getAround = function(range: number): RoomPosition[] {
    const positions: RoomPosition[] = [];
    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        positions.push(new RoomPosition(this.x + x, this.y + y, this.roomName));
      }
    }
    return positions.filter(p => p.x >= 0 && p.y >= 0 && p.x < 50 && p.y < 50);
  }
  RoomPosition.prototype.getDirected = function(dir: DirectionConstant): RoomPosition {
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

  RoomPosition.prototype.isBorderCell = function(): boolean {
    return this.x === 0 || this.x === 49 || this.y === 0 || this.y === 49;
  };

  Creep.prototype.wander = function(): CreepMoveReturnCode {
    if (!this.fatigue) {
      let direction = (Math.floor(Math.random() * 8) + 1) as DirectionConstant;
      while (this.pos.getDirected(direction).isBorderCell()) {
        direction = (Math.floor(Math.random() * 8) + 1) as DirectionConstant;
      }
      return this.move(direction);
    }
    else return ERR_TIRED;
  }

  Object.defineProperty(Creep.prototype, "roleMemory", {
    get: function roleMemory() {
        return this.memory as CreepRoleMemory;
    }
  });
}
