const repairPriority = {
  "spawn": 0,
  "extension": 10,
  "road": 15,
  "tower": 20,

  "storage": 25,
  "link": 25,
  "constructedWall": 25,

  "rampart": 30,

  "observer": 50,
  "powerSpawn": 50,
  "extractor": 50,
  "lab": 50,
  "terminal": 50,
  "container": 50,
  "nuker": 50,
  "factory": 50,

  "invaderCore": 999,
  "keeperLair": 999,
  "controller": 999,
  "powerBank": 999,
  "portal": 999
};

export function towerRepairing(): void {
  _.forEach(Game.rooms, room => {
    const toRepair = _.sortBy(room.find(FIND_STRUCTURES, { filter: s => s.hits < s.hitsMax }), s => repairPriority[s.structureType] * 1000 - (s.hitsMax - s.hits)/s.hitsMax);
    const hurtCreeps = _.sortBy(room.find(FIND_MY_CREEPS, { filter: c => c.hits < c.hitsMax }), c => c.hits);
    room.find<FIND_MY_STRUCTURES, StructureTower>(FIND_MY_STRUCTURES, { filter: structure => structure.structureType === STRUCTURE_TOWER })
      .forEach(tower => {
        for (let i = 0; i < toRepair.length; i++) {
          if (tower.repair(toRepair[i]) === OK) break;
        }
        for (let i = 0; i < hurtCreeps.length; i++) {
          if (tower.heal(hurtCreeps[i]) === OK) break;
        }
      });
  });
}
