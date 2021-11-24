import { ScoutData, ScoutDataArray } from "utils/declarations";
import { compress, decompress } from "utils/number-compression";

export type SegmentCache<T> = Readonly<{
  get: () => T;
  clear: () => void;
  commit: () => void;
  saveChanges: () => void;
  fullness: () => number;
}>;

function segmentCache<T, U = T>(
  segmentId: number,
  defaultValue: string,
  converterFromSegment: (val: U) => T,
  converterFromData: (val: T | undefined) => U
): SegmentCache<T> {
  let segmentValue: T | undefined;
  let valueChanged = false;
  return {
    fullness: () => RawMemory.segments[segmentId]?.length ?? 0,
    get: () => {
      if (!RawMemory.segments[segmentId]) {
        RawMemory.segments[segmentId] = defaultValue;
      }
      segmentValue ??= converterFromSegment(JSON.parse(RawMemory.segments[segmentId]) as U);
      return segmentValue;
    },
    commit: () => {
      valueChanged = true;
    },
    saveChanges: () => {
      if (valueChanged) {
        RawMemory.segments[segmentId] = JSON.stringify(converterFromData(segmentValue));
        valueChanged = false;
      }
    },
    clear: () => {
      segmentValue = undefined;
      valueChanged = false;
    }
  };
}

export const segments = {
  scoutData: segmentCache<Partial<Record<string, ScoutData>>, Partial<Record<string, ScoutDataArray>>>(
    3,
    "{}",
    data => {
      const result: Partial<Record<string, ScoutData>> = {};
      Object.keys(data).forEach(key => {
        const val = data[key];
        if (val) {
          result[key] = {
            tick: val[0],
            spawn: val[1],
            sources: val[2],
            ctrlLvl: val[3],
            srcCtrlAvgDst: val[4],
            swampRatio: val[5],
            wallRatio: val[6],
            enemies: val[7],
            enemyStructures: val[8]
          };
        }
      });
      return result;
    },
    data => {
      const result: Partial<Record<string, ScoutDataArray>> = {};
      Object.keys(data || {}).forEach(key => {
        const val = (data || {})[key];
        if (val) {
          result[key] = [
            val.tick,
            val.spawn,
            val.sources,
            val.ctrlLvl,
            val.srcCtrlAvgDst,
            val.swampRatio,
            val.wallRatio,
            val.enemies,
            val.enemyStructures
          ];
        }
      });
      return result;
    }
  ),
  pathData: segmentCache<Partial<Record<string, CostMatrix>>, Partial<Record<string, string>>>(
    4,
    "{}",
    data => {
      const result: Partial<Record<string, CostMatrix>> = {};
      Object.keys(data).forEach(key => {
        const val = data[key];
        if (val) {
          result[key] = decompress(val);
        }
      });
      return result;
    },
    data => {
      const result: Partial<Record<string, string>> = {};
      Object.keys(data || {}).forEach(key => {
        const val = (data || {})[key];
        if (val) {
          result[key] = compress(val);
        }
      });
      return result;
    }
  )
};

export function reclearSegmentCaches(): void {
  _.forEach(segments, segment => segment.clear());
}

export function saveSegmentCaches(): void {
  _.forEach(segments, segment => segment.saveChanges());
}
