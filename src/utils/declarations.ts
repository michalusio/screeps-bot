import { CreepRoleMemory } from './creeps/role-memory';

declare global {
  interface Memory {
    creepIndex?: number;
    civilizationLevel: { [roomName: string]: number };
  }

  interface Creep {
    roleMemory: CreepRoleMemory;
  }

  interface RoomPosition {
    getAround(range: number): RoomPosition[];
  }
}

export function injectMethods(): void {
  RoomPosition.prototype.getAround = function(range: number): RoomPosition[] {
    const positions: RoomPosition[] = [];
    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        positions.push(new RoomPosition(this.x + x, this.y + y, this.roomName));
      }
    }
    return positions.filter(p => p.x >= 0 && p.y >= 0 && p.x < 50 && p.y < 50);
  }
  Object.defineProperty(Creep.prototype, "roleMemory", {
    get: function roleMemory() {
        return this.memory as CreepRoleMemory;
    }
});
}
