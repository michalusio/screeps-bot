import { Placement } from "./placement";

export const rampartize: Placement = {
  name: "Rampartize",
  isPlaced: (room: Room) =>
    room
      .find(FIND_MY_STRUCTURES)
      .filter(s => s.structureType !== "controller")
      .every(s => hasRampart(s)),
  place: (room: Room) => {
    room
      .find(FIND_MY_STRUCTURES)
      .filter(s => s.structureType !== "controller" && !hasRampartOrSite(s))
      .forEach(s => s.pos.createConstructionSite(STRUCTURE_RAMPART));
  }
};

function hasRampart(s: AnyOwnedStructure): unknown {
  return s.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === "rampart").length > 0;
}

function hasRampartOrSite(s: AnyOwnedStructure): unknown {
  return (
    s.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === "rampart").length > 0 ||
    s.pos.lookFor(LOOK_CONSTRUCTION_SITES).filter(s => s.structureType === "rampart").length > 0
  );
}
