import { energyContainerNotFull, getByIdOrNew, moveTo, tryDoOrMove } from 'utils/creeps';
import { log } from 'utils/log';

import { CreepRoleMemory, stateChanger } from '../utils/creeps/role-memory';

export interface RemoteMiner extends Creep {
  memory: RemoteMinerMemory;
}

export interface RemoteMinerMemory extends CreepRoleMemory {
  role: 'remoteminer';
  originRoom: string;
  sourceRoom?: string;

  storagePoint?: Id<StructureStorage | StructureSpawn | StructureContainer | StructureExtension>;

  state: 'mining' | 'hauling';
}

export const remoteMinerBody = (energyAvailable: number) => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  while (body.length < 18) {
    if (energy < 50) break;
    body.push(MOVE);
    energy -= 50;
    if (energy < 100) break;
    body.push(CARRY);
    energy -= 100;
    if (energy < 100) break;
    body.push(WORK);
    energy -= 100;
  }
  return body;
};

export const remoteMinerMemory: RemoteMinerMemory = {
  newCreep: true,
  role: 'remoteminer',
  originRoom: '',
  sourceRoom: undefined,
  state: 'mining'
};

export function remoteMinerBehavior(creep: Creep): void {
  const remoteMiner = creep as RemoteMiner;
  const creepMemory = remoteMiner.memory;
  if (creepMemory.originRoom === '') {
    creepMemory.originRoom = remoteMiner.room.name;
    creepMemory.sourceRoom = 'W4N8';
  }
  switch (creepMemory.state) {

    case 'mining':
      if (remoteMiner.store.getFreeCapacity() === 0) {
        changeState('hauling', remoteMiner, true);
      }
      if (creepMemory.sourceRoom === undefined) {
        log(`Remote miner ${creep.name} missing source room`);
        break;
      }
      if (creep.room.name === creepMemory.sourceRoom) {
        const source = _.first(remoteMiner.room.find(FIND_SOURCES_ACTIVE));
        if (!source) {
          const newSource = _.first(_.sortBy(remoteMiner.room.find(FIND_SOURCES), s => s.ticksToRegeneration));
          moveTo(remoteMiner, newSource)();
        } else if (tryDoOrMove(() => remoteMiner.harvest(source), moveTo(remoteMiner, source)) !== OK) {
          changeState('hauling', remoteMiner, true);
        }
      } else {
        const exit = creep.room.findExitTo(creepMemory.sourceRoom);
        if (exit != ERR_NO_PATH && exit != ERR_INVALID_ARGS) {
          const closestExit = remoteMiner.pos.findClosestByRange(exit);
          if (closestExit) {
            moveTo(remoteMiner, closestExit)();
          }
          else log(`Remote miner ${remoteMiner.name} can't find an exit to ${creepMemory.sourceRoom}`);
        }
        else log(`Remote miner ${remoteMiner.name} can't find a path to ${creepMemory.sourceRoom}`);
      }
      break;

    case 'hauling':
      if (remoteMiner.room.name === creepMemory.originRoom) {
        const storage = getByIdOrNew(creepMemory.storagePoint, energyContainerNotFull(remoteMiner));
        if (!storage) break;
        if (storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
          changeState('hauling', remoteMiner, true);
          break;
        }
        creepMemory.storagePoint = storage.id;
        const transferCode = tryDoOrMove(() => remoteMiner.transfer(storage, RESOURCE_ENERGY), moveTo(remoteMiner, storage));
        if (transferCode === ERR_FULL) {
          changeState('hauling', remoteMiner, true);
        }
        else if (remoteMiner.store.getUsedCapacity(RESOURCE_ENERGY) <= 1) {
          changeState('mining', remoteMiner);
        }
      }
      else {
        const exit = remoteMiner.room.findExitTo(creepMemory.originRoom);
        if (exit != ERR_NO_PATH && exit != ERR_INVALID_ARGS) {
          const closestExit = remoteMiner.pos.findClosestByRange(exit);
          if (closestExit) {
            moveTo(remoteMiner, closestExit)();
          }
          else log(`Remote miner ${remoteMiner.name} can't find an exit to ${creepMemory.sourceRoom}`);
        }
        else log(`Remote miner ${remoteMiner.name} can't find a path to ${creepMemory.sourceRoom}`);
      }
      break;

  }
}

const changeState = stateChanger<RemoteMinerMemory>('storagePoint');
