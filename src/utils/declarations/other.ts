import { AttackerMemory } from "jobs/offence/attacker";
import { RemoteMinerMemory } from "jobs/remote-miner";
import { log } from "utils/log";

declare global {
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
  function showSpawnFor(room: string): void;
}

export function injectOtherMethods(): void {
  if (!Memory.afterReset) return;

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
}
