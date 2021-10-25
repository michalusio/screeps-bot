import { myTowers, structuresToRepairByTower } from "cache/structure-cache";

export function towerRepairing(): void {
  _.forEach(Game.rooms, room => {
    const towers = myTowers(room, 50);
    if (towers.length === 0) return;

    const hurtCreeps = _.sortBy(
      room.find(FIND_MY_CREEPS).filter(c => c.hits < c.hitsMax),
      c => c.hits
    );

    const enemies = hurtCreeps.length >= towers.length ? [] : _.sortBy(room.find(FIND_HOSTILE_CREEPS), c => c.hits);

    const toRepair = hurtCreeps.length + enemies.length >= towers.length ? [] : structuresToRepairByTower(room, 0);

    towers.forEach(tower => {
      for (let i = 0; i < enemies.length; i++) {
        if (tower.attack(enemies[i]) === OK) {
          say(tower, "⚔️");
          return;
        }
      }
      for (let i = 0; i < hurtCreeps.length; i++) {
        if (tower.heal(hurtCreeps[i]) === OK) {
          say(tower, "🚑");
          return;
        }
      }
      if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > 100) {
        for (let i = 0; i < toRepair.length; i++) {
          if (tower.repair(toRepair[i]) === OK) {
            say(tower, "🔧");
            return;
          }
        }
      }
    });
  });
}

function say(tower: StructureTower, text: string): void {
  tower.room.visual.rect(tower.pos.x - 0.5, tower.pos.y - 1.75, 1, 1, {
    fill: "#CCCCCC",
    stroke: "#555555",
    opacity: 1
  });
  tower.room.visual.text(text, tower.pos.x, tower.pos.y - 1, {
    align: "center"
  });
}
