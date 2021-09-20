import { extensionPlacer } from 'placements/extension-placement';
import { placeContainers } from 'placements/place-containers';
import { placeTower } from 'placements/place-tower';
import { Placement } from 'placements/placement';
import { roadsBetweenSources } from 'placements/roads-between-sources';
import { roadsToController } from 'placements/roads-to-controller';
import { roadsToExits } from 'placements/roads-to-exits';
import { roadsToSources } from 'placements/roads-to-sources';
import { spawnPlaza } from 'placements/spawn-plaza';

export type RoleRequirements = { [key: string]: number; };

export type Stage = { roles: RoleRequirements, structures?: Placement[] };

export type RoomMode = Readonly<{
  name: string;
  stages: Stage[];
}>;

export const Bootstrap: RoomMode = {
  name: "Bootstrap",
  stages: [
    { roles: { miner: 1, hauler: 1 } },
    { roles: { miner: 2, hauler: 2, upgrader: 1 } },
    { roles: { defender: 1 } },
    { roles: { upgrader: 2, builder: 1 }, structures: [extensionPlacer(5)] },
    { roles: { builder: 1, remoteminer: 1 }, structures: [roadsToSources, roadsBetweenSources] },
    { roles: { defender: 2, builder: 1, hauler: 3 }, structures: [roadsToController, spawnPlaza, extensionPlacer(10)] },
    { roles: { towerbro: 1, remoteminer: 2 }, structures: [placeContainers, placeTower(1)] },
    { roles: { remoteminer: 4, upgrader: 3 }, structures: [roadsToExits, extensionPlacer(20)] },
    { roles: {}, structures: [placeTower(2), extensionPlacer(30)] }
  ]
};

export const modes: { [mode: string]: RoomMode } = {
  [Bootstrap.name]: Bootstrap
};
