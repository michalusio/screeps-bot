import { mySpawns } from "cache/structure-cache";

export function sacrificeBehavior(creep: Creep): void {
  switch (creep.roleMemory.state) {
    case "blood for the blood god":
      {
        creep.room.visual.text("blood for the blood god", creep.pos.x, creep.pos.y - 1, {
          align: "center",
          backgroundColor: "gray",
          backgroundPadding: 0.15
        });
        const goTo = _.first(mySpawns(creep.room));
        if (!goTo) {
          creep.suicide();
        } else creep.travelTo(goTo)();
        if (Math.random() < 0.001) creep.suicide();
      }
      break;
  }
}

export function beginSacrifice(creep: Creep): void {
  creep.roleMemory.role = "sacrifice";
  creep.roleMemory.state = "blood for the blood god";
}
