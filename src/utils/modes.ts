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

export interface RoleRequirements {
  [key: string]: number;
}

export interface Stage {
  roles: RoleRequirements;
  structures?: Placement[];
}

export type RoomMode = Readonly<{
  name: string;
  canEnter: (room: Room) => boolean;
  canLeave: (room: Room) => boolean;
  stages: (room: Room) => Stage[];
}>;

export const Bootstrap = {
  name: "Bootstrap",
  canEnter: (): boolean => false,
  canLeave: (room: Room): boolean => (room.controller?.level ?? -1) >= 6,
  stages: (room: Room): Stage[] => {
    const anyEnemies = room.find(FIND_HOSTILE_CREEPS).length > 0 ? 1 : 0;
    const builderMod = constructionSites(room, 50).length > 0 ? 1 : 0;
    const energyLayingAroundMod = Math.min(2, Math.floor(_.sum(droppedEnergy(room, 1), e => e.amount) / 750));
    const fullRCL = (room.controller?.level ?? -1) === 8;
    const RCL3 = (room.controller?.level ?? -1) <= 3;
    return [
      { roles: { miner: 1, hauler: 1 } },
      { roles: { miner: 2, hauler: 2, upgrader: 1 } },
      { roles: { defender: anyEnemies } },
      { roles: { upgrader: fullRCL ? 1 : 2, builder: builderMod }, structures: [rcl(2), extensionPlacer(5)] },
      { roles: { builder: 2 * builderMod, remoteminer: 1 }, structures: [roadsToSources, placeSourceContainers] },
      {
        roles: { towerbro: 1, upgrader: fullRCL ? 1 : RCL3 ? 5 : 3, hauler: 2 + energyLayingAroundMod },
        structures: [roadsToController, placeControllerContainers, rcl(3), extensionPlacer(10)]
      },
      { roles: { hauler: 2 + energyLayingAroundMod }, structures: [placeTower(1)] },
      { roles: { remoteminer: 2 }, structures: [roadsBetweenSources] },
      { roles: { remoteminer: 4 }, structures: [roadsToExits, rcl(4), extensionPlacer(20)] },
      { roles: { remoteminer: 6, scout: 1 }, structures: [storage, placeTower(2), rcl(5), link, extensionPlacer(30)] }
    ];
  }
};

export const Scouting = {
  name: "Scouting",
  canEnter: (room: Room): boolean => (room.controller?.level ?? -1) >= 6 && room.memory.children.length === 0,
  canLeave: (room: Room): boolean => (room.controller?.level ?? -1) >= 7,
  stages: (room: Room): Stage[] => {
    const redFlags = Object.keys(Game.flags).some(f => Game.flags[f].color === COLOR_RED);
    return [
      ...Bootstrap.stages(room),
      { roles: { scout: 3, upgrader: 4, miner: 3 }, structures: [extensionPlacer(40), extractor] },
      { roles: { attacker: redFlags ? 2 : 0 } }
    ];
  }
};

export const Colonizing = {
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
        structures: [extensionPlacer(40), extractor, rcl(7), ...(room.memory.children.length > 0 ? [] : [canClaim])]
      },
      { roles: { attacker: redFlags ? 2 : 0 } },
      {
        roles: {
          scout: 3,
          claimer: claimedRooms || roomsToBuild || room.memory.children.length === 0 ? 0 : 1,
          conquistadores: roomsToBuild ? 4 : 0
        }
      }
    ];
  }
};

export const Idling = {
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
        structures: [extensionPlacer(40), extractor, rcl(7), extensionPlacer(50)]
      },
      { roles: { attacker: redFlags ? 2 : 0 } }
    ];
  }
};

export const modes: { [mode: string]: RoomMode } = {
  [Bootstrap.name]: Bootstrap,
  [Scouting.name]: Scouting,
  [Colonizing.name]: Colonizing,
  [Idling.name]: Idling
};
