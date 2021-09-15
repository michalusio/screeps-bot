import { injectMethods } from 'utils/declarations';
import { CreepCounter, flagBuilding, logging, renewIfNotBusy, wrapWithCount, wrapWithStages } from 'utils/main-sections';
import { creepActions } from 'utils/main-sections/creep-actions';
import { towerRepairing } from 'utils/main-sections/tower-repairing';

injectMethods();

export const loop =
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
);

