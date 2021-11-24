export type MoveToReturnCode = CreepMoveReturnCode | -2 | -5 | -7;

export type PERFORMED_ACTION = 1;
export const PERFORMED_ACTION: PERFORMED_ACTION = 1;

export function tryDoOrMove(
  doAction: () => ScreepsReturnCode,
  doMove: () => MoveToReturnCode
): ScreepsReturnCode | PERFORMED_ACTION {
  const doCode = doAction();
  if (doCode === ERR_NOT_IN_RANGE || doCode === ERR_NOT_ENOUGH_RESOURCES) {
    return doMove();
  }
  return doCode === OK ? PERFORMED_ACTION : doCode;
}
