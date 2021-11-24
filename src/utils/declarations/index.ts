import { injectCreepMethods } from "./creep";
import { injectOtherMethods } from "./other";
import { injectRoomMethods } from "./room";
import { injectRoomPositionMethods } from "./room-position";
import { injectStructureSpawnMethods } from "./structure-spawn";

export interface ScoutData {
  tick: number;
  enemies: { [player: string]: number };
  enemyStructures: { [player: string]: number };
  spawn: boolean;
  sources: number;
  ctrlLvl: number | null;
  srcCtrlAvgDst: number;
  swampRatio: number;
  wallRatio: number;
}

export type ScoutDataArray = [
  number, // tick
  boolean, // spawn
  number, // sources
  number | null, // controllerLevel
  number, // sourcesControllerAverageDistance
  number, // swampRatio
  number, // wallRatio
  { [player: string]: number }, // enemies
  { [player: string]: number } // enemyStructures
];

declare global {
  interface String {
    hashCode(): number;
  }

  interface Memory {
    creepIndex: number;
    noRemoteMining: string[];
    visuals: boolean;
    afterReset: boolean;
    visualizer: string[];
    timings: { [key: string]: number };
    stats: {
      gcl: {
        level: number;
        progress: number;
        progressTotal: number;
      };
      cpu: {
        value: number;
        limit: number;
      };
      heap: {
        value: number;
        limit: number;
      };
      energy: {
        value: number;
        limit: number;
      };
      room: {
        [name: string]: {
          energy: {
            capacity: number;
            available: number;
            storage: number;
            terminal: number;
          };
          rcl: {
            level: number;
            progress: number;
            progressTotal: number;
          };
          image?: string;
        };
      };
      creep: {
        [role: string]: { count: number; time: number };
      };
      cacheHits: {
        [key: string]: {
          hits: number;
          cpu: number;
        };
      };
      timings: {
        [key: string]: number;
      };
    };
  }

  interface FlagMemory {
    date: number;
  }
}

export function injectMethods(): void {
  if (!Memory.afterReset) return;

  injectOtherMethods();
  injectCreepMethods();
  injectRoomPositionMethods();
  injectRoomMethods();
  injectStructureSpawnMethods();

  String.prototype.hashCode = function (): number {
    return Array.from(this).reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0);
  };

  Array.prototype.flatMap = function <T, U>(callback: (value: T, index: number, array: T[]) => U[]): U[] {
    return (this as Array<T>).reduce(
      (acc, value, index, array) => acc.concat(callback(value, index, array)),
      <Array<U>>[]
    );
  };
}
