import { CreepRoleMemory } from '../utils/creep-role-memory';

export interface Miner extends Creep {
  memory: MinerMemory;
}

export interface MinerMemory extends CreepRoleMemory {
  role: 'miner';

  sourcePoint: Id<Source> | undefined;
  sourcePath: PathStep[] | undefined;

  transferPoint: Id<StructureSpawn> | Id<StructureExtension>;
  transferPath: PathStep[] | undefined;

  state: 'mining' | 'transfering';
}

export const minerBody = [WORK, MOVE, CARRY];
export const minerMemory = {
  newCreep: true,
  role: 'miner',
  sourcePoint: undefined,
  sourcePath: undefined,
  transferPoint: undefined,
  transferPath: undefined,
  state: 'mining'
};

export function minerBehavior(creep: Creep): void {
  const miner = creep as Miner;
  const creepMemory = miner.memory;
  switch (creepMemory.state) {
    case 'mining':
      const source = (creepMemory.sourcePoint
      ? Game.getObjectById(creepMemory.sourcePoint)
      : null) || miner.room.find(FIND_SOURCES_ACTIVE)[0];
      if (!source) break;
      creepMemory.sourcePoint = source.id;
      const harvestCode = miner.harvest(source);
      if (harvestCode === ERR_NOT_IN_RANGE) {
        if (!creepMemory.sourcePath) {
          creepMemory.sourcePath = miner.room.findPath(miner.pos, source.pos);
        }
        miner.moveByPath(creepMemory.sourcePath);
      }
      if (miner.store.energy >= miner.store.getCapacity()) {
        creepMemory.state = 'transfering';
        creepMemory.transferPath = undefined;
      }
      break;
    case 'transfering':
      const transfer = (creepMemory.transferPoint
        ? Game.getObjectById(creepMemory.transferPoint)
        : null) || miner.room.find(FIND_MY_SPAWNS)[0];
      // TODO: Add extension support for find
      if (!transfer) break;
      creepMemory.transferPoint = transfer.id;
      const transferCode = miner.transfer(transfer, RESOURCE_ENERGY);
      if (transferCode === ERR_NOT_IN_RANGE) {
        if (!creepMemory.transferPath) {
          creepMemory.transferPath = miner.room.findPath(miner.pos, transfer.pos);
        }
        miner.moveByPath(creepMemory.transferPath);
      }
      if (miner.store.energy <= 0) {
        creepMemory.state = 'mining';
        creepMemory.sourcePath = undefined;
      }
      break;
  }
}
