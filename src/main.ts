import { initMemHack } from "memhack";
import { injectMethods, ScoutData, ScoutDataArray } from "utils/declarations";
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
import { mySpawns } from "cache/structure-cache";
import { tryDo } from "try-do";
import { cacheHits } from "cache/cache-util";
import { saveSegmentCaches, reclearSegmentCaches, segments } from "cache/segment-cache";

let creepActionsTimings: { [role: string]: [number, number] } = {};

Memory.afterReset = true;

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
  Memory.noRemoteMining = [];
}
if (Memory.visuals === undefined) {
  Memory.visuals = true;
}

if (!Memory.rooms) {
  Memory.rooms = {};
}

RawMemory.setActiveSegments([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

export const loop = (): void => {
  Memory.timings = {};
  Object.keys(cacheHits).forEach(key => (cacheHits[key] = { hits: 0, cpu: 0 }));
  reclearSegmentCaches();
  body();
  saveSegmentCaches();
  grafana();
  if (Game.cpu.getUsed() < Game.cpu.tickLimit - 100 && Game.cpu.generatePixel) {
    Game.cpu.generatePixel();
  }
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
