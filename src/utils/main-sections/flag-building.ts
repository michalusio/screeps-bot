export function flagBuilding(): void {
  for (const flagName in Game.flags) {
    const flag = Game.flags[flagName];
    if (!flag) continue;
    switch (flag.color) {
      case COLOR_WHITE:
        for (const flagName2 in Game.flags) {
          const flag2 = Game.flags[flagName2];
          if (!flag2) continue;
          if (flag2.color === COLOR_WHITE && flag2.secondaryColor === flag.secondaryColor && flag.name > flag2.name) {
            [...flag.pos.findPathTo(flag2, { ignoreCreeps: true, ignoreRoads: true }), flag.pos, flag2.pos]
              .filter(pos => flag.room?.lookForAt(LOOK_STRUCTURES, pos.x, pos.y)?.length === 0 && flag.room?.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y)?.length === 0)
              .forEach(pos => flag.room?.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD));
            flag.remove();
            flag2.remove();
            break;
          }
        }
        break;
    }
  }
}
