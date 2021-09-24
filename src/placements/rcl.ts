import { log } from "utils/log";
import { Placement } from "./placement";

type PossibleControllerLevels = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const rcl: (n: PossibleControllerLevels) => Placement = (n: PossibleControllerLevels) => ({
  name: `RCL ${n}`,
  isPlaced: (room: Room) => (room.controller?.level ?? -1) >= n,
  place: () => log(`Waiting for RCL ${n}`)
});
