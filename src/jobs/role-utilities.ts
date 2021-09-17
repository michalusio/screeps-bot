import { CreepRoleMemory } from 'utils/creeps/role-memory';

import { builderBehavior, builderBody, builderMemory } from './builder';
import { defenderBehavior, defenderBody, defenderMemory } from './defender';
import { haulerBehavior, haulerBody, haulerMemory } from './hauler';
import { minerBehavior, minerBody, minerMemory } from './miner';
import { remoteMinerBehavior, remoteMinerBody, remoteMinerMemory } from './remote-miner';
import { towerbroBehavior, towerbroBody, towerbroMemory } from './tower-bro';
import { upgraderBehavior, upgraderBody, upgraderMemory } from './upgrader';

export type Role = [
  (energyAvailable: number) => BodyPartConstant[],
  CreepRoleMemory,
  (creep: Creep) => void
];

export type Roles = Readonly<{
  [key: string]: Role;
}>;

export const roleUtilities: Roles = {
  miner: [minerBody, minerMemory, minerBehavior],
  upgrader: [upgraderBody, upgraderMemory, upgraderBehavior],
  builder: [builderBody, builderMemory, builderBehavior],
  defender: [defenderBody, defenderMemory, defenderBehavior],
  hauler: [haulerBody, haulerMemory, haulerBehavior],
  towerbro: [towerbroBody, towerbroMemory, towerbroBehavior],
  remoteminer: [remoteMinerBody, remoteMinerMemory, remoteMinerBehavior]
}
