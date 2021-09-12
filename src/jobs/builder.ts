import { energyContainerNotEmpty, getByIdOrNew, moveTo, structuresToRepair, tryDoOrMove } from 'utils/creep-utils';

import { CreepRoleMemory } from '../utils/creep-role-memory';

export interface Builder extends Creep {
  memory: BuilderMemory;
}

export interface BuilderMemory extends CreepRoleMemory {
  role: 'builder';

  sourcePoint?: Id<StructureStorage> | Id<StructureContainer>;

  buildPoint?: Id<ConstructionSite>;
  repairPoint?: Id<AnyStructure>;

  state: 'building' | 'repairing' | 'sourcing';
}

export const builderBody = (energyAvailable: number) => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  while (energy >= 200) {
    body.push(WORK);
    body.push(CARRY);
    body.push(MOVE);
    energy -= 200;
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
      const source = getByIdOrNew(creepMemory.sourcePoint, energyContainerNotEmpty(builder.room));
      if (!source) {
        if (Game.time % 3 === 0) {
          builder.move((Math.floor(Math.random() * 8)+1) as DirectionConstant);
        }
        break;
      }
      if (source.store.getUsedCapacity(RESOURCE_ENERGY) < 200) {
        creepMemory.sourcePoint = undefined;
        break;
      }
      creepMemory.sourcePoint = source.id;
      tryDoOrMove(() => builder.withdraw(source, RESOURCE_ENERGY), moveTo(builder, source));
      if (builder.store.getUsedCapacity(RESOURCE_ENERGY) >= builder.store.getCapacity()) {
        if (creepMemory.repairPoint || structuresToRepair(builder.room).length > 0) {
          creepMemory.state = 'repairing';
        }
        else {
          creepMemory.state = 'building';
        }
      }
      break;

    case 'building':
      {
        const site = getByIdOrNew(creepMemory.buildPoint, () => _.min(builder.room.find(FIND_CONSTRUCTION_SITES), s => s.progressTotal - s.progress));
        if (!site) {
          creepMemory.buildPoint = undefined;
          creepMemory.state = 'sourcing';
          break;
        };
        creepMemory.buildPoint = site.id;
        tryDoOrMove(() => builder.build(site), moveTo(builder, site));
        if (builder.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
          creepMemory.state = 'sourcing';
        }
      }
      break;


    case 'repairing':
      {
        const site = getByIdOrNew(creepMemory.repairPoint, () => _.sample(structuresToRepair(builder.room)));
        if (!site) break;
        if (site.hits >= site.hitsMax) {
          creepMemory.repairPoint = undefined;
          creepMemory.state = 'sourcing';
          break;
        }
        creepMemory.repairPoint = site.id;
        tryDoOrMove(() => builder.repair(site), moveTo(builder, site));
        if (builder.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
          creepMemory.state = 'sourcing';
        }
      }
      break;
  }
}
