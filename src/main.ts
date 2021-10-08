import { initMemHack } from "memhack";
import { injectMethods } from "utils/declarations";
import {
  CreepCounter,
  creepActions,
  towerRepairing,
  flagBuilding,
  logging,
  renewIfNotBusy,
  wrapWithCount,
  wrapWithStages
} from "main-sections";
import { Bitmap, Color } from "external/console-bitmap";
import { mySpawns } from "cache/structure-cache";
import { tryDo } from "try-do";
import { cacheHits } from "cache/cache-util";

let creepActionsTimings: { [role: string]: [number, number] } = {};

injectMethods();

initMemHack();

const body = () => {
  try {
    wrapWithCount(
      wrapWithStages((creepCount: CreepCounter) => {
        creepActionsTimings = tryDo(creepActions) as { [role: string]: [number, number] };
        tryDo(towerRepairing);
        tryDo(renewIfNotBusy);
        tryDo(flagBuilding);
        tryDo(logging, creepCount);
      })
    )();
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.stack);
      console.log(e.message);
    } else console.log(e);
  }
};

if (!Memory.creepIndex) {
  Memory.creepIndex = 0;
}
if (!Memory.noRemoteMining) {
  Memory.noRemoteMining = ["W4N8"];
}
if (!Memory.visuals) {
  Memory.visuals = true;
}
if (!Memory.scoutData) {
  Memory.scoutData = {};
}
Memory.afterReset = true;

export const loop = (): void => {
  Memory.timings = {};
  Object.keys(cacheHits).forEach(key => (cacheHits[key] = { hits: 0, cpu: 0 }));
  body();
  grafana();
  Memory.afterReset = false;
};

function grafana(): void {
  Memory.stats = {
    cpu: { limit: 0, value: 0 },
    gcl: { level: 0, progress: 0, progressTotal: 0 },
    heap: { limit: 0, value: 0 },
    energy: { limit: 0, value: 0 },
    room: {},
    creep: {},
    cacheHits: {},
    timings: {}
  };
  Object.keys(creepActionsTimings).forEach(
    creepName =>
      (Memory.stats.creep[creepName] = {
        count: creepActionsTimings[creepName][0],
        time: creepActionsTimings[creepName][1]
      })
  );
  const rooms = Object.keys(Game.rooms)
    .map(r => Game.rooms[r])
    .filter(room => mySpawns(room).length > 0);
  rooms.forEach(room => {
    Memory.stats.room[room.name] = {
      energy: {
        available: room.energyAvailable,
        capacity: room.energyCapacityAvailable,
        storage: room.storage?.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0,
        terminal: room.terminal?.store.getCapacity(RESOURCE_ENERGY) ?? 0
      },
      rcl: {
        level: room.controller?.level ?? 0,
        progress: room.controller?.progress ?? 0,
        progressTotal: room.controller?.progressTotal ?? 0
      }
    };
    Memory.stats.energy.limit +=
      room.energyCapacityAvailable +
      (room.storage?.store.getCapacity(RESOURCE_ENERGY) ?? 0) +
      (room.terminal?.store.getCapacity(RESOURCE_ENERGY) ?? 0);
    Memory.stats.energy.value +=
      room.energyAvailable +
      (room.storage?.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0) +
      (room.terminal?.store.getCapacity(RESOURCE_ENERGY) ?? 0);
  });
  Memory.stats.gcl = {
    level: Game.gcl.level,
    progress: Game.gcl.progress,
    progressTotal: Game.gcl.progressTotal
  };
  Memory.stats.cpu = {
    limit: Game.cpu.limit,
    value: Game.cpu.getUsed()
  };

  if (Game.cpu.getHeapStatistics) {
    const heapStats = Game.cpu.getHeapStatistics();
    Memory.stats.heap = {
      limit: heapStats.heap_size_limit,
      value: heapStats.used_heap_size
    };
  }

  Memory.stats.cacheHits = cacheHits;
  Memory.stats.timings = Memory.timings;
}

const bitmapCache = new Map<string, Bitmap>();
const MY: Color = [0, 255, 38, 255];
const ENEMY: Color = [180, 33, 50, 255];

function generateBitmapOfRoom(roomName: string): Bitmap {
  const room = Game.rooms[roomName];
  if (!bitmapCache.has(roomName)) {
    const terrainBmp = new Bitmap(50, 50);
    const terrain = room.lookForAtArea(LOOK_TERRAIN, 0, 0, 49, 49, true);

    terrain.forEach(tile => {
      const x = tile.x;
      const y = tile.y;
      switch (tile.terrain) {
        case "wall":
          terrainBmp.setPixel(x, y, [0, 0, 0, 255]);
          break;
        case "swamp":
          terrainBmp.setPixel(x, y, [34, 38, 20, 255]);
          break;
        case "plain":
          terrainBmp.setPixel(x, y, [43, 43, 43, 255]);
          break;
      }
    });
    bitmapCache.set(roomName, terrainBmp);
  }
  const bmp = (bitmapCache.get(roomName) as Bitmap).copy();
  room.find(FIND_STRUCTURES).forEach(structure => {
    if (structure instanceof OwnedStructure) {
      if (structure.my) {
        bmp.setPixel(structure.pos.x, structure.pos.y, MY);
      } else {
        bmp.setPixel(structure.pos.x, structure.pos.y, ENEMY);
      }
    } else {
      bmp.setPixel(structure.pos.x, structure.pos.y, [60, 60, 60, 255]);
    }
  });
  room.find(FIND_CREEPS).forEach(creep => {
    if (creep.my) {
      bmp.setPixel(creep.pos.x, creep.pos.y, MY);
    } else {
      bmp.setPixel(creep.pos.x, creep.pos.y, ENEMY);
    }
  });

  return bmp;
}
