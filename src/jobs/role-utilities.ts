import { CreepRoleMemory } from 'utils/creep-role-memory';

import { builderBehavior, builderBody, builderMemory } from './builder';
import { defenderBehavior, defenderBody, defenderMemory } from './defender';
import { minerBehavior, minerBody, minerMemory } from './miner';
import { upgraderBehavior, upgraderBody, upgraderMemory } from './upgrader';

export type Roles = Readonly<{
  [key: string]: [
    (energyAvailable: number) => BodyPartConstant[],
    CreepRoleMemory,
    (creep: Creep) => void
  ];
}>;

export const roleUtilities: Roles = {
  miner: [minerBody, minerMemory, minerBehavior],
  upgrader: [upgraderBody, upgraderMemory, upgraderBehavior],
  builder: [builderBody, builderMemory, builderBehavior],
  defender: [defenderBody, defenderMemory, defenderBehavior]
}
