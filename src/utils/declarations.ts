import { exits, getPathFromCache } from "cache/path-cache";
import { extensionsToSpawnFrom } from "cache/structure-cache";
import { BODYPART_PRIORITY } from "configs";
import { AttackerMemory } from "jobs/offence/attacker";
import { RemoteMinerMemory } from "jobs/remote-miner";
import { MoveToReturnCode } from "./creeps";

import { CreepRoleMemory } from "./creeps/role-memory";
import { log } from "./log";

const treatedAsFreeType: LookConstant[] = [
  LOOK_CREEPS,
  LOOK_ENERGY,
  LOOK_RESOURCES,
  LOOK_FLAGS,
  LOOK_TOMBSTONES,
  LOOK_RUINS,
  LOOK_POWER_CREEPS
];

export interface ScoutData {
  roomName: string;
  tick: number;
  enemies: { [player: string]: number };
  enemyStructures: { [player: string]: number };
  spawn: boolean;
  sources: number;
  controllerLvl: number | null;
  sourcesControllerAverageDistance: number;
  swampRatio: number;
  wallRatio: number;
}

function splitRoomName(name: string): [string, string, string, string] | null {
  const split = /^([WE])(\d+)([NS])(\d+)$/.exec(name);
  return split ? [split[1], split[2], split[3], split[4]] : null;
}

declare global {
  interface String {
    hashCode(): number;
  }
  interface Memory {
    creepIndex: number;
    noRemoteMining: string[];
    visuals: boolean;
    scoutData: { [key: string]: ScoutData };
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

  interface Creep {
    roleMemory: CreepRoleMemory;
    wander(): CreepMoveReturnCode;
    travelTo(
      target: RoomPosition | _HasRoomPosition,
      avoid?: (room: Room) => RoomPosition[],
      options?: MoveToOpts | undefined
    ): () => MoveToReturnCode;
    travelInto(
      target: RoomPosition | _HasRoomPosition,
      avoid?: (room: Room) => RoomPosition[],
      options?: MoveToOpts | undefined
    ): MoveToReturnCode;
  }

  interface StructureSpawn {
    /**
     * Start the creep spawning process. The required energy amount can be withdrawn from all spawns and extensions in the room.
     *
     * @param body An array describing the new creep’s body. Should contain 1 to 50 elements with one of these constants:
     *  * WORK
     *  * MOVE
     *  * CARRY
     *  * ATTACK
     *  * RANGED_ATTACK
     *  * HEAL
     *  * TOUGH
     *  * CLAIM
     * @param name The name of a new creep. It must be a unique creep name, i.e. the Game.creeps object should not contain another creep with the same name (hash key).
     * @param opts An object with additional options for the spawning process.
     * @returns One of the following codes:
     * ```
     * OK                       0   The operation has been scheduled successfully.
     * ERR_NOT_OWNER            -1  You are not the owner of this spawn.
     * ERR_NAME_EXISTS          -3  There is a creep with the same name already.
     * ERR_BUSY                 -4  The spawn is already in process of spawning another creep.
     * ERR_NOT_ENOUGH_ENERGY    -6  The spawn and its extensions contain not enough energy to create a creep with the given body.
     * ERR_INVALID_ARGS         -10 Body is not properly described or name was not provided.
     * ERR_RCL_NOT_ENOUGH       -14 Your Room Controller level is insufficient to use this spawn.
     * ```
     */
    spawnCreepCached(body: BodyPartConstant[], name: string, opts?: SpawnOptions | undefined): ScreepsReturnCode;
  }

  interface RoomMemory {
    civilizationLevel: number;
    orders: { [role: string]: number };
    wallRepairs: boolean;
    prioritizeBuilding: boolean;
    mode: string;
    children: string[];
  }

  interface FlagMemory {
    date: number;
  }

  interface RoomPosition {
    getFreeSpaceAround(): number;
    getEmptyAround(): RoomPosition[];
    getAround(range: number): RoomPosition[];
    getDirected(dir: DirectionConstant): RoomPosition;
    isBorderCell(): boolean;
    canBuild(): boolean;
    isEmpty(): boolean;
    hasRoad(): boolean;
    _isEmpty?: boolean;
    _hasRoad?: boolean;
    _tick?: number;
  }

  interface Room {
    getRoomNameOnSide(side: ExitConstant): string | null;
    createConstructionSiteIfEmpty(x: number, y: number, type: BuildableStructureConstant): ScreepsReturnCode;
    createConstructionSiteForced(x: number, y: number, type: BuildableStructureConstant): ScreepsReturnCode;
  }

  // eslint-disable-next-line no-var
  var RoomTrackerInjected: boolean;
  // eslint-disable-next-line no-var
  var roomsViewed: { tick: number; roomName: string }[];
  function forceInjectRoomTracker(): void;
  function clear(): void;

  function assignRemotes(howMany: number, roomName: string): void;
  function order(roomName: string, role: string, howMany: number): void;
  function rally(color: ColorConstant, howMany: number): void;
  function minBy<T>(collection: T[], iteratee?: (val: T) => number): T | undefined;
  function getRoomNameOnSide(name: string, side: ExitConstant): string | null;
  function showSpawnFor(room: string): void;
}

export function injectMethods(): void {
  global.minBy = function <T>(collection: T[], iteratee?: (val: T) => number): T | undefined {
    const result = _.min(collection, iteratee) as T | number;
    return result === Number.POSITIVE_INFINITY ? undefined : (result as T);
  };

  global.showSpawnFor = function (room: string): void {
    if (!Memory.visualizer) Memory.visualizer = [];
    Memory.visualizer.push(room);
  };

  global.clear = function (): void {
    console.log(
      "<script>angular.element(document.getElementsByClassName('fa fa-trash ng-scope')[0].parentNode).scope().Console.clear()</script>"
    );
  };

  String.prototype.hashCode = function (): number {
    return Array.from(this).reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0);
  };

  global.assignRemotes = function (howMany: number, roomName: string): void {
    const remoteMinerCreeps = Object.keys(Game.creeps)
      .map(id => Game.creeps[id])
      .filter(c => c.roleMemory.role === "remoteminer" && !(c.roleMemory as RemoteMinerMemory).sourceRoom);
    if (remoteMinerCreeps.length < howMany) {
      log(`Cannot assign ${howMany} remote miners - only ${remoteMinerCreeps.length} are left unassigned.`);
    } else {
      _.take(remoteMinerCreeps, howMany).forEach(c => ((c.roleMemory as RemoteMinerMemory).sourceRoom = roomName));
    }
  };

  global.order = function (roomName: string, role: string, howMany: number): void {
    const room = new Room(roomName);
    room.memory.orders = room.memory.orders || {};
    room.memory.orders[role] = (room.memory.orders[role] || 0) + howMany;
  };

  global.rally = function (color: ColorConstant, howMany: number): void {
    const attackerCreeps = Object.keys(Game.creeps)
      .map(id => Game.creeps[id])
      .filter(c => c.roleMemory.role === "attacker" && !(c.roleMemory as AttackerMemory).squadColor);
    if (attackerCreeps.length < howMany) {
      log(`Cannot assign ${howMany} attackers - only ${attackerCreeps.length} are left unassigned.`);
    } else {
      _.take(attackerCreeps, howMany).forEach(c => ((c.roleMemory as AttackerMemory).squadColor = color));
    }
  };

  global.getRoomNameOnSide = function (name: string, side: ExitConstant): string | null {
    const parts = splitRoomName(name);
    if (!parts) return null;
    const we = parts[0] + parts[1];
    const ns = parts[2] + parts[3];
    switch (side) {
      case 1:
        if (parts[2] === "S") {
          if (parts[3] === "0") {
            return we + "N0";
          } else {
            return we + "S" + (parseInt(parts[3]) - 1).toString();
          }
        } else {
          return we + "N" + (parseInt(parts[3]) + 1).toString();
        }
      case 3:
        if (parts[0] === "W") {
          if (parts[1] === "0") {
            return "E0" + ns;
          } else {
            return "W" + (parseInt(parts[1]) - 1).toString() + ns;
          }
        } else {
          return "E" + (parseInt(parts[1]) + 1).toString() + ns;
        }
      case 5:
        if (parts[2] === "N") {
          if (parts[3] === "0") {
            return we + "S0";
          } else {
            return we + "N" + (parseInt(parts[3]) - 1).toString();
          }
        } else {
          return we + "S" + (parseInt(parts[3]) + 1).toString();
        }
      case 7:
        if (parts[0] === "E") {
          if (parts[1] === "0") {
            return "W0" + ns;
          } else {
            return "E" + (parseInt(parts[1]) - 1).toString() + ns;
          }
        } else {
          return "W" + (parseInt(parts[1]) + 1).toString() + ns;
        }
    }
  };

  Room.prototype.getRoomNameOnSide = function (side: ExitConstant): string | null {
    return global.getRoomNameOnSide(this.name, side);
  };

  Room.prototype.createConstructionSiteIfEmpty = function (
    x: number,
    y: number,
    structureType: BuildableStructureConstant
  ): ScreepsReturnCode {
    if (
      this.lookAt(x, y).every(l => (l.type === "terrain" && l.terrain !== "wall") || treatedAsFreeType.includes(l.type))
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
      .filter(l => (l.type === "terrain" && l.terrain !== "wall") || treatedAsFreeType.includes(l.type))
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
      this.look().every(l => (l.type === "terrain" && l.terrain !== "wall") || treatedAsFreeType.includes(l.type));
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

  StructureSpawn.prototype.spawnCreepCached = function (
    body: BodyPartConstant[],
    name: string,
    opts?: SpawnOptions
  ): ScreepsReturnCode {
    const extensions = extensionsToSpawnFrom(this.room, 50)
      .map(id => Game.getObjectById(id))
      .filter(o => o != null) as (StructureSpawn | StructureExtension)[];
    return this.spawnCreep(
      _.sortBy(body, part => BODYPART_PRIORITY[part]),
      name,
      { energyStructures: extensions, ...opts }
    );
  };

  Creep.prototype.wander = function (): CreepMoveReturnCode {
    if (!this.fatigue) {
      const direction = (Math.floor(Math.random() * 8) + 1) as DirectionConstant;
      if (!this.pos.getDirected(direction).isBorderCell()) {
        return this.move(direction);
      } else return ERR_BUSY;
    } else return ERR_TIRED;
  };

  Creep.prototype.travelTo = function (
    target: RoomPosition | _HasRoomPosition,
    avoid?: (room: Room) => RoomPosition[],
    options?: MoveToOpts | undefined
  ): () => MoveToReturnCode {
    const targeted = target instanceof RoomPosition ? target : target.pos;
    const hash = (this.roleMemory.role.hashCode() >> 8) & 0xffffff;
    return () => {
      if (this.pos.isNearTo(targeted)) return OK;
      const pathMove = this.moveByPath(
        getPathFromCache(this.pos, targeted, {
          ignoreRoads: false,
          ignoreCreeps: false,
          range: 1,
          visualizePathStyle: { stroke: "#" + hash.toString(16) },
          ...(options ?? {})
        })
      );
      if (pathMove === -10) {
        const addonAvoided = targeted.isBorderCell() ? [] : exits(this.room, 1000);
        const avoided = [...(avoid?.call(undefined, this.room) ?? []), ...addonAvoided];
        const costCallback = (name: string, matrix: CostMatrix) => {
          avoided.filter(a => a.roomName === name).forEach(a => matrix.set(a.x, a.y, Number.MAX_VALUE));
          return matrix;
        };
        return this.moveTo(targeted, {
          reusePath: 10,
          heuristicWeight: 1.5,
          visualizePathStyle: { stroke: "#" + hash.toString(16) },
          maxOps: 1000,
          maxRooms: 1,
          costCallback: avoid ? costCallback : undefined,
          ...(options ?? {})
        });
      }
      return pathMove;
    };
  };

  Creep.prototype.travelInto = function (
    target: RoomPosition | _HasRoomPosition,
    avoid?: (room: Room) => RoomPosition[],
    options?: MoveToOpts | undefined
  ): MoveToReturnCode {
    const targeted = target instanceof RoomPosition ? target : target.pos;
    const hash = (this.roleMemory.role.hashCode() >> 8) & 0xffffff;

    const pathMove = this.moveByPath(
      getPathFromCache(this.pos, targeted, {
        ignoreRoads: false,
        ignoreCreeps: false,
        range: 0,
        visualizePathStyle: { stroke: "#" + hash.toString(16) },
        ...(options ?? {})
      })
    );
    if (pathMove === -10) {
      const addonAvoided = targeted.isBorderCell() ? [] : exits(this.room, 1000);
      const avoided = [...(avoid?.call(undefined, this.room) ?? []), ...addonAvoided];
      const costCallback = (name: string, matrix: CostMatrix) => {
        avoided.filter(a => a.roomName === name).forEach(a => matrix.set(a.x, a.y, Number.MAX_VALUE));
        return matrix;
      };
      return this.moveTo(targeted, {
        reusePath: 10,
        heuristicWeight: 1.5,
        visualizePathStyle: { stroke: "#" + hash.toString(16) },
        maxOps: 1000,
        maxRooms: 1,
        costCallback: avoid ? costCallback : undefined,
        ...(options ?? {})
      });
    }
    return pathMove;
  };

  Object.defineProperty(Creep.prototype, "roleMemory", {
    get: function roleMemory() {
      return (this as Creep).memory as CreepRoleMemory;
    }
  });
}
