import { CreepRoleMemory } from '../utils/creep-role-memory';

export interface Claimer extends Creep {
  memory: ClaimerMemory;
}

export interface ClaimerMemory extends CreepRoleMemory {
  role: 'claimer';

  claimedRoomName?: string;

  state: 'claiming' | 'idling';
}

export const claimerBody = (energyAvailable: number) => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  let times = 0;
  while (energy >= 180) {
    times++;
    energy -= 180;
  }
  return body;
};

export const defenderMemory: DefenderMemory = {
  newCreep: true,
  role: 'defender',
  attackTarget: undefined,
  ticksInPeace: undefined,
  state: 'scouting'
};

export function defenderBehavior(creep: Creep): void {
  const defender = creep as Defender;
  const creepMemory = defender.memory;
  switch (creepMemory.state) {

    case 'scouting':
      {
        const enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (!enemy) {
          creepMemory.ticksInPeace = (creepMemory.ticksInPeace ?? 0) + 1;
          if (creepMemory.ticksInPeace >= 10 && creep.hitsMax/2 > creep.hits) {
            creep.suicide();
          }
          if (!defender.fatigue) {
            defender.move((Math.floor(Math.random() * 8)+1) as DirectionConstant);
          }
          break;
        }
        creepMemory.attackTarget = enemy.id;
        creepMemory.ticksInPeace = 0;
        creepMemory.state = 'fighting';
      }
      break;

    case 'fighting':
      {
        if (!creepMemory.attackTarget) {
          creepMemory.state = 'scouting';
          break;
        }
        const enemy = Game.getObjectById(creepMemory.attackTarget);
        if (!enemy) {
          creepMemory.state = 'scouting';
          creepMemory.attackTarget = undefined;
          break;
        }
        if (creep.attack(enemy) === ERR_NOT_IN_RANGE) {
          creep.moveTo(enemy);
        }
      }
      break;

  }
}
