import { extensionPlacer } from "placements/extension-placement";
import { placeControllerContainers, placeSourceContainers } from "placements/place-containers";
import { Placement } from "placements/placement";
import { placeTower } from "placements/place-tower";
import { rcl } from "placements/rcl";
import { roadsBetweenSources } from "placements/roads-between-sources";
import { roadsToController } from "placements/roads-to-controller";
import { roadsToExits } from "placements/roads-to-exits";
import { roadsToSources } from "placements/roads-to-sources";
import { link, storage } from "placements/storage-and-link";
import { canClaim } from "placements/can-claim";
import { constructionSites, mySpawns } from "cache/structure-cache";
import { droppedEnergy } from "cache/source-cache";
import { extractor } from "placements/extractor";
import { rampartize } from "placements/rampartize";
import { rampartizeAndFill } from "placements/rampartize-fill";

export interface RoleRequirements {
  [key: string]: number;
}

export interface Stage {
  roles: RoleRequirements;
  structures?: Placement[];
  wallRepair?: number;
}

export type RoomMode = Readonly<{
  name: string;
  canEnter: (room: Room) => boolean;
  canLeave: (room: Room) => boolean;
  stages: (room: Room) => Stage[];
}>;

export const Bootstrap: RoomMode = {
  name: "Bootstrap",
  canEnter: (): boolean => false,
  canLeave: (room: Room): boolean => (room.controller?.level ?? -1) >= 6,
  stages: (room: Room): Stage[] => {
    const anyEnemies = room.find(FIND_HOSTILE_CREEPS).length > 0 ? 1 : 0;
    const builderMod = constructionSites(room, 5).length > 0 ? 1 : 0;
    const energyLayingAroundMod = Math.min(2, Math.floor(_.sum(droppedEnergy(room, 1), e => e.amount) / 750));
    const fullRCL = (room.controller?.level ?? -1) === 8;
    const RCL3 = (room.controller?.level ?? -1) <= 3;
    return [
      { roles: { defender: anyEnemies } },
      { roles: { miner: 1, hauler: 1 } },
      { roles: { miner: 2, hauler: 2 + energyLayingAroundMod, upgrader: 1 }, structures: [rcl(2)] },
      {
        roles: { builder: 2 * builderMod },
        structures: [placeSourceContainers, extensionPlacer(5)]
      },
      { roles: { upgrader: fullRCL ? 1 : 2, remoteminer: 2 }, structures: [roadsToSources] },
      {
        roles: { towerbro: 1, upgrader: fullRCL ? 1 : RCL3 ? 5 : 3, remoteminer: 3 },
        structures: [roadsToController, placeControllerContainers, rcl(3), extensionPlacer(10)]
      },
      { roles: {}, structures: [placeTower(1)] },
      { roles: {}, structures: [roadsBetweenSources] },
      { roles: { remoteminer: 4 }, structures: [roadsToExits, rcl(4), extensionPlacer(20)] },
      {
        roles: { remoteminer: 6, scout: 1 },
        structures: [storage, rampartize, rampartizeAndFill, rcl(5), placeTower(2), link, extensionPlacer(30)],
        wallRepair: 10000
      }
    ];
  }
};

export const Scouting: RoomMode = {
  name: "Scouting",
  canEnter: (room: Room): boolean => (room.controller?.level ?? -1) >= 6 && room.memory.children.length === 0,
  canLeave: (room: Room): boolean => (room.controller?.level ?? -1) >= 7,
  stages: (room: Room): Stage[] => {
    const redFlags = Object.keys(Game.flags).some(f => Game.flags[f].color === COLOR_RED);
    return [
      ...Bootstrap.stages(room),
      {
        roles: { scout: 3, upgrader: 4, miner: 3 },
        structures: [extensionPlacer(40), extractor],
        wallRepair: 50000
      },
      { roles: { attacker: redFlags ? 2 : 0 } }
    ];
  }
};

export const Colonizing: RoomMode = {
  name: "Colonizing",
  canEnter: (room: Room): boolean => (room.controller?.level ?? -1) >= 7,
  canLeave: (room: Room): boolean => {
    const claimedRooms = room.memory.children
      .map(c => Game.rooms[c])
      .some(r => (r.controller?.my ?? false) && r.controller?.progress === 0);
    const roomsToBuild = room.memory.children
      .map(c => Game.rooms[c])
      .some(r => (r.controller?.my ?? false) && r.controller?.progress === 0 && mySpawns(r).length === 0);
    return !claimedRooms && !roomsToBuild && room.memory.children.length > 0;
  },
  stages: (room: Room): Stage[] => {
    const claimedRooms = room.memory.children
      .map(c => Game.rooms[c])
      .some(r => (r.controller?.my ?? false) && r.controller?.progress === 0);
    const roomsToBuild = room.memory.children
      .map(c => Game.rooms[c])
      .some(r => (r.controller?.my ?? false) && r.controller?.progress === 0 && mySpawns(r).length === 0);
    const redFlags = Object.keys(Game.flags).some(f => Game.flags[f].color === COLOR_RED);
    return [
      ...Bootstrap.stages(room),
      {
        roles: { miner: 3 },
        structures: [
          extensionPlacer(40),
          extractor,
          rcl(7),
          placeTower(3),
          ...(room.memory.children.length > 0 ? [] : [canClaim])
        ],
        wallRepair: 1000000
      },
      { roles: { attacker: redFlags ? 2 : 0 } },
      {
        roles: {
          scout: 3,
          claimer: claimedRooms || roomsToBuild || room.memory.children.length === 0 ? 0 : 1,
          conquistadores: roomsToBuild ? 4 : 0
        },
        wallRepair: 10000000
      }
    ];
  }
};

export const Idling: RoomMode = {
  name: "Idling",
  canEnter: (room: Room): boolean => room.memory.children.length > 0,
  canLeave: (): boolean => false,
  stages: (room: Room): Stage[] => {
    const fullRCL = (room.controller?.level ?? -1) === 8;
    const redFlags = Object.keys(Game.flags).some(f => Game.flags[f].color === COLOR_RED);
    return [
      ...Bootstrap.stages(room),
      {
        roles: { scout: 3, upgrader: fullRCL ? 1 : 4, miner: 3 },
        structures: [extensionPlacer(40), extractor, rcl(7), placeTower(3), extensionPlacer(50)],
        wallRepair: 2000000
      },
      {
        roles: { attacker: redFlags ? 2 : 0 },
        structures: [rcl(8), placeTower(6)],
        wallRepair: 50000000
      }
    ];
  }
};

export const modes: { [mode: string]: RoomMode } = {
  [Bootstrap.name]: Bootstrap,
  [Scouting.name]: Scouting,
  [Colonizing.name]: Colonizing,
  [Idling.name]: Idling
};
