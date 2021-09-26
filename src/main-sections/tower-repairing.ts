const repairPriority = {
  spawn: 0,
  extension: 10,
  road: 15,
  container: 15,
  tower: 20,

  storage: 25,
  link: 25,
  constructedWall: 25,

  rampart: 30,

  observer: 50,
  powerSpawn: 50,
  extractor: 50,
  lab: 50,
  terminal: 50,
  nuker: 50,
  factory: 50,

  invaderCore: 999,
  keeperLair: 999,
  controller: 999,
  powerBank: 999,
  portal: 999
};

export function towerRepairing(): void {
  _.forEach(Game.rooms, room => {
    const towers = room
      .find<FIND_MY_STRUCTURES, StructureTower>(FIND_MY_STRUCTURES)
      .filter(
        structure => structure.structureType === STRUCTURE_TOWER && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
      );
    if (towers.length === 0) return;

    const toRepair = _.sortBy(
      room
        .find(FIND_STRUCTURES)
        .filter(
          s =>
            s.hits < s.hitsMax &&
            (s.room.memory.wallRepairs || (s.structureType !== "constructedWall" && s.structureType !== "rampart"))
        ),
      s => repairPriority[s.structureType] * 1000 - (s.hitsMax - s.hits) / s.hitsMax
    );
    const hurtCreeps = _.sortBy(
      room.find(FIND_MY_CREEPS).filter(c => c.hits < c.hitsMax),
      c => c.hits
    );
    const enemies = _.sortBy(room.find(FIND_HOSTILE_CREEPS), c => c.hits);
    towers.forEach(tower => {
      for (let i = 0; i < enemies.length; i++) {
        if (tower.attack(enemies[i]) === OK) return;
      }
      for (let i = 0; i < hurtCreeps.length; i++) {
        if (tower.heal(hurtCreeps[i]) === OK) return;
      }
      if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > 100) {
        for (let i = 0; i < toRepair.length; i++) {
          if (tower.repair(toRepair[i]) === OK) return;
        }
      }
    });
  });
}
