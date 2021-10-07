import { tryDoOrMove } from "utils/creeps";

import { CreepRoleMemory } from "../utils/creeps/role-memory";

export interface Defender extends Creep {
  memory: DefenderMemory;
}

export interface DefenderMemory extends CreepRoleMemory {
  role: "defender";

  attackTarget?: Id<Creep>;
  ticksInPeace?: number;

  state: "fighting" | "scouting";
}

export const defenderBody = (energyAvailable: number): BodyPartConstant[] => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  let times = 0;
  while (energy >= 230 && times < 6) {
    times++;
    energy -= 230;
  }
  if (times === 0) return [];
  for (let i = 0; i < times; i++) {
    body.push(TOUGH);
    body.push(TOUGH);
    body.push(TOUGH);
    body.push(TOUGH);
    body.push(TOUGH);
  }
  for (let i = 0; i < times; i++) {
    body.push(MOVE);
    body.push(MOVE);
    body.push(ATTACK);
  }
  while (energy >= 80) {
    body.push(MOVE);
    energy -= 80;
  }
  return body;
};

export const defenderMemory: DefenderMemory = {
  newCreep: true,
  role: "defender",
  attackTarget: undefined,
  ticksInPeace: undefined,
  state: "scouting"
};

export function defenderBehavior(creep: Creep): void {
  const defender = creep as Defender;
  const creepMemory = defender.memory;
  switch (creepMemory.state) {
    case "scouting":
      {
        const enemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (!enemy) {
          creepMemory.ticksInPeace = (creepMemory.ticksInPeace ?? 0) + 1;
          if (creepMemory.ticksInPeace >= 10 && creep.hitsMax / 2 > creep.hits) {
            creep.suicide();
          }
          defender.wander();
          break;
        }
        creepMemory.attackTarget = enemy.id;
        creepMemory.ticksInPeace = 0;
        creepMemory.state = "fighting";
      }
      break;

    case "fighting":
      {
        if (!creepMemory.attackTarget) {
          creepMemory.state = "scouting";
          break;
        }
        const enemy = Game.getObjectById(creepMemory.attackTarget);
        if (!enemy) {
          creepMemory.state = "scouting";
          creepMemory.attackTarget = undefined;
          break;
        }
        const enemy2 = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (enemy2 && enemy2?.pos.getRangeTo(creep.pos) < enemy.pos.getRangeTo(creep.pos) / 2) {
          creepMemory.attackTarget = enemy2.id;
          tryDoOrMove(() => creep.attack(enemy2), creep.travelTo(enemy2), creep, enemy2);
        } else {
          tryDoOrMove(() => creep.attack(enemy), creep.travelTo(enemy), creep, enemy);
        }
      }
      break;
  }
}
