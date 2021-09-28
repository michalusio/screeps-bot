import { log } from "utils/log";
import { Placement } from "./placement";

export const canClaim: Placement = {
  name: `Can claim another room`,
  isPlaced: () => Game.gcl.level > _.sum(Memory.rooms, r => (Object.keys(r).length > 0 ? 1 : 0)),
  place: () => log(`Waiting for GCL ${_.sum(Memory.rooms, r => (Object.keys(r).length > 0 ? 1 : 0)) + 1}`)
};
