import { HOSTILE_CREEP_AVOID_ZONE_SIZE, MY_CREEP_PATH_COST } from "configs";
import { cacheForKey } from "./cache-util";
import { creepMyAndPositions } from "./creep-cache";
import { constructionSites, structures } from "./structure-cache";

const costMatrixTerrainCache = cacheForKey("cost matrix terrain", (roomNameAndMod: `${string}|${number}`) => {
  const [roomName, mod] = roomNameAndMod.split("|");
  const modifier = mod ? parseFloat(mod) : 0;
  console.log(modifier);
  const matrix = new PathFinder.CostMatrix();
  const terrain = Game.map.getRoomTerrain(roomName);
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      switch (terrain.get(x, y)) {
        case TERRAIN_MASK_WALL:
          matrix.set(x, y, 255);
          break;
        case TERRAIN_MASK_SWAMP:
          matrix.set(x, y, 1 + 9 * modifier);
          break;
        case 0:
          matrix.set(x, y, 1 + modifier);
          break;
      }
    }
  }
  return matrix;
});

export const costMatrixCache = cacheForKey("cost matrix", (data: `${string}|${boolean}|${boolean}|${number}`) => {
  const [roomName, ignoreRoads, ignoreCreeps, moveMod] = data.split("|");
  let matrix = costMatrixTerrainCache(`${roomName}|${moveMod}` as `${string}|${number}`, 999999);
  const room = Game.rooms[roomName];
  if (!room) return matrix;
  matrix = matrix.clone();
  if (ignoreCreeps === "false") {
    creepMyAndPositions(room, 7).forEach(c => {
      if (c.my) matrix.set(c.pos.x, c.pos.y, MY_CREEP_PATH_COST);
      else c.pos.getAround(HOSTILE_CREEP_AVOID_ZONE_SIZE).forEach(pos => matrix.set(pos.x, pos.y, 254));
    });
  }
  structures(room, 31).forEach(s => {
    if (s.structureType === STRUCTURE_ROAD) {
      if (ignoreRoads === "false" && matrix.get(s.pos.x, s.pos.y) < 50) {
        // Favor roads over plain tiles
        matrix.set(s.pos.x, s.pos.y, 1);
      }
    } else if (s.structureType !== STRUCTURE_CONTAINER && s.structureType !== STRUCTURE_RAMPART) {
      // Can't walk through non-walkable buildings
      matrix.set(s.pos.x, s.pos.y, 255);
    }
  });
  constructionSites(room, 31)
    .filter(
      s =>
        s.structureType !== STRUCTURE_RAMPART &&
        s.structureType !== STRUCTURE_CONTAINER &&
        s.structureType !== STRUCTURE_ROAD
    )
    .forEach(s => matrix.set(s.pos.x, s.pos.y, 255));

  return matrix;
});
