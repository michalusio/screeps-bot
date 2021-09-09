import { CreepRoleMemory } from 'utils/creep-role-memory';

import { minerBehavior, minerBody, minerMemory } from './miner';
import { upgraderBehavior, upgraderBody, upgraderMemory } from './upgrader';

export const roleUtilities: { [key: string]: [BodyPartConstant[], CreepRoleMemory, (creep: Creep) => void]} = {
  miner: [minerBody, minerMemory, minerBehavior],
  upgrader: [upgraderBody, upgraderMemory, upgraderBehavior],
}
