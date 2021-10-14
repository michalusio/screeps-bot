import { Placement } from "./placement";

export const extractor: Placement = {
  name: "Extractor",
  isPlaced: (room: Room) =>
    !room
      .find(FIND_MINERALS)
      .some(
        m =>
          m.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === "extractor").length +
            m.pos.lookFor(LOOK_CONSTRUCTION_SITES).filter(s => s.structureType == "extractor").length ===
          0
      ),
  place: (room: Room) => {
    room
      .find(FIND_MINERALS)
      .filter(
        m =>
          m.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === "extractor").length +
            m.pos.lookFor(LOOK_CONSTRUCTION_SITES).filter(s => s.structureType == "extractor").length ===
          0
      )
      .forEach(m => m.pos.createConstructionSite(STRUCTURE_EXTRACTOR));
  }
};
