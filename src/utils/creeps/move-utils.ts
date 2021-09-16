import { hashCode } from 'utils/hash';

export type MoveToReturnCode = CreepMoveReturnCode | -2 | -5 | -7;

export function tryDoOrMove(doAction: () => ScreepsReturnCode, doMove: () => MoveToReturnCode): ScreepsReturnCode {
  const doCode = doAction();
  if (doCode === ERR_NOT_IN_RANGE) {
    return doMove();
  }
  return doCode;
}

export function moveTo(creep: Creep, target: RoomPosition | { pos: RoomPosition }, avoid?: (room: Room) => RoomPosition[]): () => MoveToReturnCode {
  const avoided = avoid?.call(undefined, creep.room) ?? [];
  const costCallback = (name: string, matrix: CostMatrix) => avoided.filter(a => a.roomName === name).forEach(a => matrix.set(a.x, a.y, Number.MAX_VALUE));
  const hash = (hashCode(creep.roleMemory.role) >> 8) & 0xffffff;
  return () => creep.fatigue === 0 ? creep.moveTo(target, { reusePath: 5, visualizePathStyle: { stroke: '#'+hash.toString(16) }, costCallback: avoid ? costCallback : undefined }) : ERR_TIRED;
}
