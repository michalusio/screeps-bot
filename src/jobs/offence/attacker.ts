import { directionExitFromSpawn, exitsFromRoomToRoom } from "cache/path-cache";
import { ATTACKER_SQUAD_SIZE } from "configs";
import { tryDoOrMove } from "utils/creeps";
import { log } from "utils/log";

import { CreepRemoteMemory, stateChanger } from "../../utils/creeps/role-memory";

export interface Attacker extends Creep {
  memory: AttackerMemory;
}

export interface AttackerMemory extends CreepRemoteMemory {
  role: "attacker";

  squadColor?: ColorConstant;
  lastFlagNumber: number;

  exitPosition?: { x: number; y: number; room: string };

  state: "fighting" | "a-move" | "scouting";
}

export const attackerBody = (energyAvailable: number): BodyPartConstant[] => {
  const toughs = 14;
  const attacks = 7;
  const moves = 25;
  const heals = 4;
  if (
    energyAvailable <
    BODYPART_COST[TOUGH] * toughs +
      BODYPART_COST[ATTACK] * attacks +
      BODYPART_COST[MOVE] * moves +
      BODYPART_COST[HEAL] * heals
  ) {
    return [];
  }
  return [
    ...new Array<BodyPartConstant>(toughs).fill(TOUGH),
    ...new Array<BodyPartConstant>(attacks).fill(ATTACK),
    ...new Array<BodyPartConstant>(moves).fill(MOVE),
    ...new Array<BodyPartConstant>(heals).fill(HEAL)
  ];
};

export const attackerMemory: AttackerMemory = {
  newCreep: true,
  role: "attacker",
  originRoom: "",
  squadColor: COLOR_RED,
  lastFlagNumber: 0,
  state: "scouting"
};

export function attackerBehavior(creep: Creep): void {
  const attacker = creep as Attacker;
  const creepMemory = attacker.memory;
  const myFlag = Object.keys(Game.flags)
    .map(f => Game.flags[f])
    .find(
      f =>
        f.color === COLOR_RED &&
        f.secondaryColor === creepMemory.squadColor &&
        f.name === `Attack${creepMemory.lastFlagNumber + 1}`
    );
  if (creepMemory.squadColor) {
    if (myFlag) {
      if (myFlag.pos.roomName !== attacker.pos.roomName && creepMemory.state !== "a-move") {
        changeStage("a-move", attacker);
      }
    } else {
      //creepMemory.squadColor = undefined;
    }
  }
  let attacking = false;

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
        const stuff = [
          ...attacker.room.find(FIND_HOSTILE_CREEPS, {
            filter: c => c.body.map(b => b.type).includes(ATTACK)
          }),
          ...attacker.room.find(FIND_HOSTILE_SPAWNS),
          ...attacker.room.find(FIND_HOSTILE_STRUCTURES, {
            filter: s => s.structureType === "rampart" || s.structureType === "tower"
          })
        ];
        const toAttack = minBy(stuff, s => s.pos.getRangeTo(attacker));
        if (toAttack) {
          tryDoOrMove(() => {
            const result = attacker.attack(toAttack);
            if (result === OK) attacking = true;
            return result;
          }, attacker.travelTo(toAttack, undefined, { ignoreCreeps: true, ignoreRoads: false }));
        } else {
          const anyEnemyCreep = attacker.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
          if (anyEnemyCreep) {
            tryDoOrMove(() => {
              const result = attacker.attack(anyEnemyCreep);
              if (result === OK) attacking = true;
              return result;
            }, attacker.travelTo(anyEnemyCreep, undefined, { ignoreCreeps: true, ignoreRoads: false }));
          } else changeStage("a-move", attacker);
        }
      }
      break;

    case "a-move":
      {
        if (!myFlag) {
          changeStage("scouting", attacker);
          break;
        }
        if (attacker.room.name === myFlag.pos.roomName) {
          if (attacker.room.find(FIND_HOSTILE_CREEPS).length === 0) {
            if (
              attacker.pos.isNearTo(myFlag) &&
              attacker.pos.findInRange(FIND_MY_CREEPS, 2, { filter: c => c.roleMemory.role === "attacker" }).length >=
                ATTACKER_SQUAD_SIZE
            ) {
              const nextFlag = creepMemory.lastFlagNumber + 1;
              attacker.pos
                .findInRange(FIND_MY_CREEPS, 2, { filter: c => c.roleMemory.role === "attacker" })
                .map(a => a as Attacker)
                .filter(a => a.memory.lastFlagNumber === creepMemory.lastFlagNumber)
                .forEach(a => (a.memory.lastFlagNumber = nextFlag));
            }
            attacker.travelInto(myFlag, undefined, { ignoreCreeps: true, ignoreRoads: false });
            break;
          } else {
            changeStage("fighting", attacker);
          }
        } else {
          if (!creepMemory.exitPosition || creepMemory.exitPosition.room !== attacker.room.name) {
            const exit = exitsFromRoomToRoom(attacker.room.name, myFlag.pos.roomName, 99999);
            if (exit != ERR_NO_PATH && exit != ERR_INVALID_ARGS) {
              const closestExit = directionExitFromSpawn(attacker.room, exit, 500);
              if (closestExit) {
                creepMemory.exitPosition = { x: closestExit[1].x, y: closestExit[1].y, room: attacker.room.name };
              } else log(`Attacker ${attacker.name} can't find an exit to ${myFlag.pos.roomName}`);
            } else log(`Attacker ${attacker.name} can't find a path to ${myFlag.pos.roomName}`);
          }
          if (creepMemory.exitPosition) {
            const exitPos = creepMemory.exitPosition;
            attacker.travelInto(new RoomPosition(exitPos.x, exitPos.y, attacker.room.name), undefined, {
              ignoreRoads: false,
              ignoreCreeps: false
            });
          }
        }
      }
      break;
  }

  if (!attacking) {
    const hurtAttackers = attacker.pos.findInRange(FIND_MY_CREEPS, 2, {
      filter: c => c.roleMemory.role === "attacker" && c.hits < c.hitsMax
    });
    const toHeal = minBy(hurtAttackers, c => c.hits);
    if (toHeal) {
      if (attacker.pos.isNearTo(toHeal)) attacker.heal(toHeal);
      else attacker.rangedHeal(toHeal);
    }
  }
}

const changeStage = stateChanger<AttackerMemory>();
