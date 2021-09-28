import { initMemHack } from "memhack";
import { injectMethods } from "utils/declarations";
import {
  CreepCounter,
  creepActions,
  towerRepairing,
  flagBuilding,
  logging,
  renewIfNotBusy,
  wrapWithCount,
  wrapWithStages
} from "main-sections";

injectMethods();

//#if _PROFILER
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import profiler from "screeps-profiler";
profiler.enable();
//#else
initMemHack();
//#endif

const body = () => {
  try {
    wrapWithCount(
      wrapWithStages((creepCount: CreepCounter) => {
        creepActions();
        towerRepairing();
        renewIfNotBusy();
        flagBuilding();
        logging(creepCount);
      })
    )();
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.stack);
    }
    console.log(e);
  }
};

if (!Memory.creepIndex) {
  Memory.creepIndex = 0;
}
if (!Memory.noRemoteMining) {
  Memory.noRemoteMining = ["W4N8"];
}
if (!Memory.cpu) {
  Memory.cpu = [];
}
if (!Memory.visuals) {
  Memory.visuals = true;
}
if (!Memory.scoutData) {
  Memory.scoutData = {};
}

export const loop = (): void => {
  //#if _PROFILER
  profiler.wrap(body);
  //#else
  body();
  //#endif
};
