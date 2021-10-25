import { mySpawns, structures } from "cache/structure-cache";
import { NEW_COLONY_SPAWN_SIZE } from "configs";
import { Placement } from "./placement";

function getRoomDefences(room: Room): number[][] {
  const terrain = room.getTerrain();
  const result = Array<number[]>(50);
  for (let x = 0; x < 50; x++) {
    result[x] = Array<number>(50);
    for (let y = 0; y < 50; y++) {
      result[x][y] = terrain.get(x, y) === TERRAIN_MASK_WALL ? 1 : 0;
    }
  }
  const structs = structures(room, 10);
  structs.forEach(s => {
    switch (s.structureType) {
      case STRUCTURE_RAMPART:
        result[s.pos.x][s.pos.y] |= 2;
        break;
      case STRUCTURE_WALL:
        result[s.pos.x][s.pos.y] |= 4;
        break;
      case STRUCTURE_ROAD:
        result[s.pos.x][s.pos.y] |= 8;
        break;
      default:
        result[s.pos.x][s.pos.y] |= 16;
        break;
    }
  });

  return result;
}

export const rampartizeAndFill: Placement = {
  name: "Rampartize And Fill",
  isPlaced: (room: Room) => {
    const spawns = mySpawns(room);
    const data = getRoomDefences(room);
    for (let x = 1; x < 49; x++) {
      for (let y = 1; y < 49; y++) {
        if (spawns.some(s => Math.abs(s.pos.x - x) + Math.abs(s.pos.y - y) <= NEW_COLONY_SPAWN_SIZE)) continue;
        if (getHowToDefend(x, y, data)) return false;
      }
    }
    return true;
  },
  place: (room: Room) => {
    const spawns = mySpawns(room);
    const data = getRoomDefences(room);
    for (let x = 1; x < 49; x++) {
      for (let y = 1; y < 49; y++) {
        if (spawns.some(s => Math.abs(s.pos.x - x) + Math.abs(s.pos.y - y) <= NEW_COLONY_SPAWN_SIZE)) continue;
        if (getHowToDefend(x, y, data)) {
          if (room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0) continue;
          if (data[x][y] >= 8) {
            room.createConstructionSite(x, y, STRUCTURE_RAMPART);
          } else {
            room.createConstructionSite(x, y, STRUCTURE_WALL);
          }
        }
      }
    }
  }
};

function getHowToDefend(x: number, y: number, data: number[][]): boolean {
  const center = data[x][y];
  if (center & 7) return false;
  const left = data[x - 1][y];
  const right = data[x + 1][y];
  const top = data[x][y - 1];
  const bottom = data[x][y + 1];

  const rampartsAround = (left & 2) + (right & 2) + (top & 2) + (bottom & 2) >= 4;
  const wallsRampartsAround = ((left & 7) > 0 && (right & 7) > 0) || ((top & 7) > 0 && (bottom & 7) > 0);
  return rampartsAround || wallsRampartsAround;
}
