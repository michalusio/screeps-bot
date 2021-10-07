export type Point = Readonly<{
  x: number;
  y: number;
}>;

export function deltaAround(range: number, withoutRange = 0): Point[] {
  const rangeDelta = _.range(-range + 1, range);
  return rangeDelta
    .flatMap(x => rangeDelta.map(y => ({ x, y })))
    .filter(pos => Math.abs(pos.x) + Math.abs(pos.y) > withoutRange);
}

export function checkerBoard(board: Point[], white: boolean): Point[] {
  return board.filter(pos => (Math.abs(pos.x) + Math.abs(pos.y)) % 2 === (white ? 0 : 1));
}

export function toRoomPositions(board: Point[], origin: RoomPosition): RoomPosition[] {
  return board
    .filter(pos => origin.x + pos.x >= 0 && origin.y + pos.y >= 0 && origin.x + pos.x < 50 && origin.y + pos.y < 50)
    .map(pos => new RoomPosition(origin.x + pos.x, origin.y + pos.y, origin.roomName));
}

export function toRoomPositionsWithDist(board: Point[], origin: RoomPosition): { pos: RoomPosition; dist: number }[] {
  return board
    .filter(pos => origin.x + pos.x >= 0 && origin.y + pos.y >= 0 && origin.x + pos.x < 50 && origin.y + pos.y < 50)
    .map(pos => ({
      pos: new RoomPosition(origin.x + pos.x, origin.y + pos.y, origin.roomName),
      dist: pos.x * pos.x + pos.y * pos.y
    }));
}
