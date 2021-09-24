export type MoveToReturnCode = CreepMoveReturnCode | -2 | -5 | -7;

export function tryDoOrMove(doAction: () => ScreepsReturnCode, doMove: () => MoveToReturnCode): ScreepsReturnCode {
  const doCode = doAction();
  if (doCode === ERR_NOT_IN_RANGE) {
    return doMove();
  }
  return doCode;
}
