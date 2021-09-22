import { initMemHack } from 'memhack';
import { injectMethods } from 'utils/declarations';
import { CreepCounter, flagBuilding, logging, renewIfNotBusy, wrapWithCount, wrapWithStages } from 'utils/main-sections';
import { creepActions } from 'utils/main-sections/creep-actions';
import { towerRepairing } from 'utils/main-sections/tower-repairing';

injectMethods();

//#if _PROFILER
//@ts-ignore
import profiler from 'screeps-profiler';
profiler.enable();
//#else
initMemHack();
//#endif

const body = () => {
  try {
    wrapWithCount(
      wrapWithStages(
        (creepCount: CreepCounter) =>
        {
          creepActions();
          towerRepairing();
          renewIfNotBusy();
          flagBuilding();
          logging(creepCount);
        }
      )
    )();
  } catch (e) {
    console.error(e);
  }
};

export const loop = () => {
  //#if _PROFILER
  profiler.wrap(body);
  //#else
  body();
  //#endif
};
