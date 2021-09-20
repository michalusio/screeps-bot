import { energyContainerNotEmpty, getByIdOrNew, moveTo, structuresToRepair, tryDoOrMove } from 'utils/creeps';

import { CreepRoleMemory, stateChanger } from '../utils/creeps/role-memory';

export interface Builder extends Creep {
  memory: BuilderMemory;
}

export interface BuilderMemory extends CreepRoleMemory {
  role: 'builder';

  sourcePoint?: Id<StructureStorage | StructureContainer | StructureSpawn | Ruin>;

  buildPoint?: Id<ConstructionSite>;
  repairPoint?: Id<AnyStructure>;

  state: 'building' | 'repairing' | 'sourcing';
}

export const builderBody = (energyAvailable: number) => {
  if (energyAvailable < BODYPART_COST[MOVE]) return [];
  const body: BodyPartConstant[] = [MOVE];
  let energy = energyAvailable - BODYPART_COST[MOVE];
  while (energy >= 150 && body.length < 49) {
    body.push(WORK);
    body.push(CARRY);
    energy -= 150;
  }
  return body;
};

export const builderMemory: BuilderMemory = {
  newCreep: true,
  role: 'builder',
  sourcePoint: undefined,
  buildPoint: undefined,
  state: 'sourcing'
};

export function builderBehavior(creep: Creep): void {
  const builder = creep as Builder;
  const creepMemory = builder.memory;
  switch (creepMemory.state) {

    case 'sourcing':
      changeStateIfFull(builder, creepMemory);
      const source = getByIdOrNew<StructureStorage | StructureContainer | StructureSpawn | Ruin>(creepMemory.sourcePoint, () => _.sample(builder.room.find(FIND_RUINS, {filter: r => r.store.getUsedCapacity(RESOURCE_ENERGY) > 0})) ?? energyContainerNotEmpty(builder)());
      if (!source) {
        if (Game.time % 3 === 0) {
          builder.wander();
          creepMemory.sourcePoint = undefined;
        }
        break;
      }
      if (source.store.getUsedCapacity(RESOURCE_ENERGY) < 200 && !(source instanceof Ruin)) {
        changeState('sourcing', builder);
        break;
      }
      creepMemory.sourcePoint = source.id;
      tryDoOrMove(() => builder.withdraw(source, RESOURCE_ENERGY), moveTo(builder, source));
      changeStateIfFull(builder, creepMemory);
      break;

    case 'building':
      {
        const site = getByIdOrNew(creepMemory.buildPoint, () => _.min(builder.room.find(FIND_CONSTRUCTION_SITES), s => (s.progressTotal - s.progress) + s.pos.getRangeTo(builder) * 100));
        if (!site) {
          changeState('sourcing', builder);
          break;
        };
        creepMemory.buildPoint = site.id;
        tryDoOrMove(() => builder.build(site), moveTo(builder, site));
        if (builder.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
          changeState('sourcing', builder);
        }
      }
      break;


    case 'repairing':
      {
        const site = getByIdOrNew(creepMemory.repairPoint, () => _.sample(structuresToRepair(builder.room)));
        if (!site || site.hits >= site.hitsMax) {
          changeState('sourcing', builder);
          break;
        }
        creepMemory.repairPoint = site.id;
        tryDoOrMove(() => builder.repair(site), moveTo(builder, site));
        if (builder.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
          changeState('sourcing', builder);
        }
      }
      break;
  }
}

const changeState = stateChanger<BuilderMemory>('buildPoint', 'repairPoint', 'sourcePoint');

function changeStateIfFull(builder: Builder, creepMemory: BuilderMemory) {
  if (builder.store.getUsedCapacity(RESOURCE_ENERGY) >= builder.store.getCapacity()) {
    if (builder.room.memory.prioritizeBuilding) {
      if (builder.room.find(FIND_MY_CONSTRUCTION_SITES).length === 0) {
        changeState('repairing', builder);
      }
      else {
        changeState('building', builder);
      }
    }
    else {
      if (creepMemory.repairPoint || structuresToRepair(builder.room).length > 0) {
        changeState('repairing', builder);
      }
      else {
        changeState('building', builder);
      }
    }
  }
}

