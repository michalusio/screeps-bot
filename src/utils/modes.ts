import { extensionPlacer } from "placements/extension-placement";
import { placeContainers } from "placements/place-containers";
import { Placement } from "placements/placement";
import { placeTower } from "placements/place-tower";
import { rcl } from "placements/rcl";
import { roadsBetweenSources } from "placements/roads-between-sources";
import { roadsToController } from "placements/roads-to-controller";
import { roadsToExits } from "placements/roads-to-exits";
import { roadsToSources } from "placements/roads-to-sources";
import { link, storage } from "placements/storage-and-link";
import { canClaim } from "placements/can-claim";
import { constructionSites, freeEnergyContainers, mySpawns } from "cache/structure-cache";
import { droppedEnergy } from "cache/source-cache";

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
    const builderMod = constructionSites(room, 50).length > 0 ? 1 : 0;
    return [
      { roles: { miner: 1, hauler: 1 } },
      { roles: { miner: 2, hauler: 2, upgrader: 1 } },
      { roles: { defender: 1 } },
      { roles: { upgrader: 2, builder: builderMod }, structures: [rcl(2), extensionPlacer(5)] },
      { roles: { builder: 2 * builderMod, remoteminer: 1 }, structures: [roadsToSources, placeContainers] },
      { roles: { towerbro: 1 }, structures: [roadsToController, rcl(3), extensionPlacer(10)] },
      { roles: {}, structures: [placeTower(1)] },
      { roles: { remoteminer: 2 }, structures: [roadsBetweenSources] },
      { roles: { remoteminer: 4, upgrader: 3 }, structures: [roadsToExits, rcl(4), extensionPlacer(20)] },
      { roles: { remoteminer: 6, scout: 1 }, structures: [storage, placeTower(2), rcl(5), link, extensionPlacer(30)] }
    ];
  }
};

const bootstrapRoles = (room: Room) => {
  const level = room.controller?.level ?? -1;
  const builderMod = constructionSites(room, 50).length > 0 ? 2 : 0;
  const miningMod = freeEnergyContainers(room, 0).length > 0 ? 1 : 0;
  const energyLayingAroundMod = Math.min(2, Math.floor(_.sum(droppedEnergy(room, 1), e => e.amount) / 750));
  const upgraderMod = level !== 8 ? 2 : 1;
  return {
    defender: 1,
    miner: miningMod + 1,
    hauler: miningMod + energyLayingAroundMod + 1,
    upgrader: upgraderMod,
    towerbro: 1,
    builder: builderMod,
    remoteminer: miningMod * 6,
    scout: 1
  };
};

const bootstrapStructures = [
  rcl(2),
  roadsToSources,
  placeContainers,
  roadsToController,
  rcl(3),
  roadsBetweenSources,
  roadsToExits,
  rcl(4),
  storage,
  placeTower(2),
  rcl(5),
  link,
  extensionPlacer(30),
  rcl(6)
];

export const Scouting = {
  name: "Scouting",
  canEnter: (room: Room): boolean => (room.controller?.level ?? -1) >= 6 && room.memory.children.length === 0,
  canLeave: (room: Room): boolean => (room.controller?.level ?? -1) >= 7,
  stages: (room: Room): Stage[] => {
    return [
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      {
        roles: bootstrapRoles(room),
        structures: bootstrapStructures
      },
      { roles: { scout: 3, upgrader: 4 } }
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
    return [
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      {
        roles: bootstrapRoles(room),
        structures: bootstrapStructures
      },
      { roles: {}, structures: [rcl(7), ...(room.memory.children.length > 0 ? [] : [canClaim])] },
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
    return [
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      EMPTY,
      {
        roles: bootstrapRoles(room),
        structures: bootstrapStructures
      },
      { roles: { scout: 3, upgrader: 4 }, structures: [extensionPlacer(40), rcl(7), extensionPlacer(50)] }
    ];
  }
};

export const modes: { [mode: string]: RoomMode } = {
  [Bootstrap.name]: Bootstrap,
  [Scouting.name]: Scouting,
  [Colonizing.name]: Colonizing,
  [Idling.name]: Idling
};

const EMPTY: Stage = {
  roles: {},
  structures: []
};
