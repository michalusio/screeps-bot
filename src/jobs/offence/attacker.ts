import { directionExitsFromSpawn, exitsFromRoomToRoom } from "cache/path-cache";
import { getByIdOrNew, tryDoOrMove } from "utils/creeps";
import { log } from "utils/log";

import { CreepRoleMemory, stateChanger } from "../../utils/creeps/role-memory";

export interface Attacker extends Creep {
  memory: AttackerMemory;
}

export interface AttackerMemory extends CreepRoleMemory {
  role: "attacker";

  squadColor?: ColorConstant;

  exitPosition?: { x: number; y: number; room: string };

  state: "fighting" | "a-move" | "scouting";
}

export const attackerBody = (energyAvailable: number): BodyPartConstant[] => {
  const toughs = 15;
  const attacks = 10;
  const moves = 25;
  if (energyAvailable < BODYPART_COST[TOUGH] * toughs + BODYPART_COST[ATTACK] * attacks + BODYPART_COST[MOVE] * moves) {
    return [];
  }
  return [
    ...new Array<BodyPartConstant>(toughs).fill(TOUGH),
    ...new Array<BodyPartConstant>(attacks).fill(ATTACK),
    ...new Array<BodyPartConstant>(moves).fill(MOVE)
  ];
};

export const attackerMemory: AttackerMemory = {
  newCreep: true,
  role: "attacker",
  squadColor: undefined,
  state: "scouting"
};

export function attackerBehavior(creep: Creep): void {
  const attacker = creep as Attacker;
  const creepMemory = attacker.memory;
  const myFlag = Object.keys(Game.flags)
    .map(f => Game.flags[f])
    .find(f => f.color === COLOR_RED && f.secondaryColor === creepMemory.squadColor);
  if (creepMemory.squadColor) {
    if (myFlag) {
      if (myFlag.pos.roomName !== creep.pos.roomName && creepMemory.state !== "a-move") {
        changeStage("a-move", attacker);
      }
    } else {
      creepMemory.squadColor = undefined;
    }
  }
  switch (creepMemory.state) {
    case "scouting":
      {
        if (attacker.room.find(FIND_HOSTILE_CREEPS).length === 0) {
          attacker.wander();
        } else {
          changeStage("fighting", attacker);
        }
      }
      break;

    case "fighting":
      {
        const enemy = attacker.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
          filter: c => c.body.map(b => b.type).includes(ATTACK)
        });
        if (enemy) {
          tryDoOrMove(() => creep.attack(enemy), creep.travelTo(enemy, undefined, { reusePath: 0 }), creep, enemy);
        } else {
          const enemySpawn = attacker.pos.findClosestByPath(FIND_HOSTILE_SPAWNS);
          if (enemySpawn) {
            tryDoOrMove(
              () => creep.attack(enemySpawn),
              creep.travelTo(enemySpawn, undefined, { reusePath: 0 }),
              creep,
              enemySpawn
            );
          } else {
            const enemyRamparts = attacker.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
              filter: s => s.structureType === "rampart" || s.structureType === "tower"
            });
            if (enemyRamparts) {
              tryDoOrMove(
                () => creep.attack(enemyRamparts),
                creep.travelTo(enemyRamparts, undefined, { reusePath: 0 }),
                creep,
                enemyRamparts
              );
            } else {
              const anyEnemyCreep = attacker.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
              if (anyEnemyCreep) {
                tryDoOrMove(
                  () => creep.attack(anyEnemyCreep),
                  creep.travelTo(anyEnemyCreep, undefined, { reusePath: 0 }),
                  creep,
                  anyEnemyCreep
                );
              } else changeStage("scouting", attacker);
            }
          }
        }
      }
      break;

    case "a-move":
      {
        if (!myFlag) {
          changeStage("scouting", attacker);
          break;
        }
        if (creep.room.name === myFlag.pos.roomName) {
          if (attacker.room.find(FIND_HOSTILE_CREEPS).length === 0) {
            creep.travelInto(myFlag);
            break;
          } else {
            creep.travelInto(myFlag);
            changeStage("fighting", attacker);
          }
        } else {
          if (!creepMemory.exitPosition || creepMemory.exitPosition.room !== attacker.room.name) {
            const exit = exitsFromRoomToRoom(attacker.room.name, myFlag.pos.roomName, 1000);
            if (exit != ERR_NO_PATH && exit != ERR_INVALID_ARGS) {
              const closestExit = directionExitsFromSpawn(attacker.room, 100).find(x => x[2] === exit);
              if (closestExit) {
                creepMemory.exitPosition = { x: closestExit[1].x, y: closestExit[1].y, room: attacker.room.name };
              } else log(`Attacker ${attacker.name} can't find an exit to ${myFlag.pos.roomName}`);
            } else log(`Attacker ${attacker.name} can't find a path to ${myFlag.pos.roomName}`);
          }
          if (creepMemory.exitPosition) {
            const exitPos = creepMemory.exitPosition;
            attacker.travelInto(new RoomPosition(exitPos.x, exitPos.y, attacker.room.name), undefined, {
              reusePath: 20
            });
          }
        }
      }
      break;
  }
}

const changeStage = stateChanger<AttackerMemory>();
