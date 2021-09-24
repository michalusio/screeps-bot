export function sacrificeBehavior(creep: Creep): void {
  switch (creep.roleMemory.state) {
    case "blood for the blood god":
      creep.room.visual.text("blood for the blood god", creep.pos.x, creep.pos.y - 1, {
        align: "center",
        backgroundColor: "gray",
        backgroundPadding: 0.15
      });
      creep.travelTo(_.first(creep.room.find(FIND_MY_SPAWNS)))();
      break;
  }
}

export function beginSacrifice(creep: Creep): void {
  creep.roleMemory.role = "sacrifice";
  creep.roleMemory.state = "blood for the blood god";
}
