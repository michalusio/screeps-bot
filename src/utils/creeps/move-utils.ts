export type MoveToReturnCode = CreepMoveReturnCode | -2 | -5 | -7;

export function tryDoOrMove(
  doAction: () => ScreepsReturnCode,
  doMove: () => MoveToReturnCode,
  me: Creep,
  target: RoomPosition | _HasRoomPosition,
  range?: number
): ScreepsReturnCode {
  if (me.pos.getRangeTo(target) > (range ?? 3)) {
    return doMove();
  }
  const doCode = doAction();
  if (doCode === ERR_NOT_IN_RANGE) {
    return doMove();
  }
  return doCode;
}
