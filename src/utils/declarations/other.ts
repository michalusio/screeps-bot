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
  function getRoomNameOnSide(name: string, side: ExitConstant): string | null;
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
}

function splitRoomName(name: string): [string, string, string, string] | null {
  const split = /^([WE])(\d+)([NS])(\d+)$/.exec(name);
  return split ? [split[1], split[2], split[3], split[4]] : null;
}
