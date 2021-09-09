import { CreepRoleMemory } from '../utils/creep-role-memory';

export interface Upgrader extends Creep {
  memory: UpgraderMemory;
}

export interface UpgraderMemory extends CreepRoleMemory {
  role: 'upgrader';

  sourcePoint: Id<StructureSpawn> | undefined;
  sourcePath: PathStep[] | undefined;

  upgradePoint: Id<StructureController> | undefined;
  upgradePath: PathStep[] | undefined;

  state: 'upgrading' | 'sourcing';
}

export const upgraderBody = [WORK, MOVE, CARRY];
export const upgraderMemory = {
  newCreep: true,
  role: 'upgrader',
  sourcePoint: undefined,
  sourcePath: undefined,
  upgradePoint: undefined,
  upgradePath: undefined,
  state: 'sourcing'
};

export function upgraderBehavior(creep: Creep): void {
  const upgrader = creep as Upgrader;
  const creepMemory = upgrader.memory;
  switch (creepMemory.state) {
    case 'sourcing':
      const source = (creepMemory.sourcePoint
      ? Game.getObjectById(creepMemory.sourcePoint)
      : null) || upgrader.room.find(FIND_MY_SPAWNS)[0];
      if (!source) break;
      creepMemory.sourcePoint = source.id;
      const withdrawCode = upgrader.withdraw(source, RESOURCE_ENERGY);
      if (withdrawCode === ERR_NOT_IN_RANGE) {
        if (!creepMemory.sourcePath) {
          creepMemory.sourcePath = upgrader.room.findPath(upgrader.pos, source.pos);
        }
        upgrader.moveByPath(creepMemory.sourcePath);
      }
      if (upgrader.store.energy >= upgrader.store.getCapacity()) {
        creepMemory.state = 'upgrading';
        creepMemory.upgradePath = undefined;
      }
      break;
    case 'upgrading':
      const transfer = (creepMemory.upgradePoint
        ? Game.getObjectById(creepMemory.upgradePoint)
        : null) || upgrader.room.controller;
      // TODO: Add extension support for find
      if (!transfer) break;
      creepMemory.upgradePoint = transfer.id;
      const transferCode = upgrader.upgradeController(transfer);
      if (transferCode === ERR_NOT_IN_RANGE) {
        if (!creepMemory.upgradePath) {
          creepMemory.upgradePath = upgrader.room.findPath(upgrader.pos, transfer.pos);
        }
        upgrader.moveByPath(creepMemory.upgradePath);
      }
      if (upgrader.store.energy <= 0) {
        creepMemory.state = 'sourcing';
        creepMemory.sourcePath = undefined;
      }
      break;
  }
}
