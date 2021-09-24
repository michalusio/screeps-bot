import { extensionPlacer } from "placements/extension-placement";
import { placeContainers } from "placements/place-containers";
import { Placement } from "placements/placement";
import { placeTower } from "placements/place-tower";
import { rcl } from "placements/rcl";
import { roadsBetweenSources } from "placements/roads-between-sources";
import { roadsToController } from "placements/roads-to-controller";
import { roadsToExits } from "placements/roads-to-exits";
import { roadsToSources } from "placements/roads-to-sources";
import { spawnPlaza } from "placements/spawn-plaza";

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
    const builderMod = room.find(FIND_MY_CONSTRUCTION_SITES).length > 0 ? 1 : 0;
    return [
      { roles: { miner: 1, hauler: 1 } },
      { roles: { miner: 2, hauler: 2, upgrader: 1 } },
      { roles: { defender: 1 } },
      { roles: { upgrader: 2, builder: builderMod }, structures: [rcl(2), extensionPlacer(5)] },
      { roles: { builder: 2 * builderMod, remoteminer: 1 }, structures: [roadsToSources, roadsBetweenSources] },
      { roles: { hauler: 3 }, structures: [roadsToController, spawnPlaza, rcl(3), extensionPlacer(10)] },
      { roles: { towerbro: 1, remoteminer: 2 }, structures: [placeContainers, placeTower(1)] },
      { roles: { remoteminer: 4, upgrader: 4 }, structures: [roadsToExits, rcl(4), extensionPlacer(20)] },
      { roles: { remoteminer: 6 }, structures: [placeTower(2), rcl(5), extensionPlacer(30)] }
    ];
  }
};

export const modes: { [mode: string]: RoomMode } = {
  [Bootstrap.name]: Bootstrap
};
