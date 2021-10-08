import { cacheForKey, cacheForRoom, cacheForStruct, RoomCache } from "./cache-util";
import { costMatrixCache } from "./cost-matrix";
import { mySpawns } from "./structure-cache";

type PathKey = `${number} ${number}|${number} ${number}|${string}${boolean}${boolean}`;

interface PathData {
  aPos: RoomPosition;
  bPos: RoomPosition;
  ignoreCreeps: boolean;
  ignoreRoads: boolean;
  range: number;
  visualizePathStyle?: PolyStyle;
}
interface PathDataWithKey extends PathData {
  key: PathKey;
}

const key = (x: PathData): PathKey =>
  `${x.aPos.x} ${x.aPos.y}|${x.bPos.x} ${x.bPos.y}|${x.aPos.roomName}${x.ignoreRoads}${x.ignoreCreeps}`;

const pathsCache = cacheForStruct<PathDataWithKey, RoomPosition[]>(
  "path cache",
  struct => {
    const path = PathFinder.search(
      struct.aPos,
      { pos: struct.bPos, range: struct.range },
      {
        maxRooms: 1,
        roomCallback: roomName => costMatrixCache(`${roomName}|${struct.ignoreRoads}|${struct.ignoreCreeps}`, 13)
      }
    ).path;

    const data: PathData = {
      aPos: struct.aPos,
      bPos: struct.bPos,
      ignoreCreeps: struct.ignoreCreeps,
      ignoreRoads: struct.ignoreRoads,
      range: struct.range,
      visualizePathStyle: undefined
    };
    for (let i = 0; i < path.length - 1; i++) {
      const pos = path[i];
      const partPath = path.slice(i + 1);
      data.aPos = pos;
      pathsCache.set({ ...data, key: key(data) }, partPath);
    }
    return path;
  },
  "key"
);

export function getPathFromCache(
  a: RoomPosition | _HasRoomPosition,
  b: RoomPosition | _HasRoomPosition,
  options: MoveToOpts = {
    ignoreRoads: false,
    ignoreCreeps: true,
    range: 1,
    visualizePathStyle: undefined
  }
): RoomPosition[] {
  const aPos = (a as _HasRoomPosition).pos || a;
  const bPos = (b as _HasRoomPosition).pos || b;

  const data: PathData = {
    aPos,
    bPos,
    ignoreRoads: options.ignoreRoads ?? false,
    ignoreCreeps: options.ignoreCreeps ?? true,
    range: options.range ?? 1
  };
  const path = pathsCache({ ...data, key: key(data) }, 7);
  if (options.visualizePathStyle) {
    new RoomVisual(aPos.roomName).poly([aPos, ...path], {
      lineStyle: "dashed",
      strokeWidth: 0.2,
      ...options.visualizePathStyle
    });
  }
  return path;
}

function getDirectionExitFor<T extends ExitConstant>(
  room: Room,
  time: number,
  pos: RoomPosition,
  exit: T
): [RoomPosition | null, T] {
  const roomNameOnSide = room.getRoomNameOnSide(exit);
  const roomOnSide = Game.rooms[roomNameOnSide];
  const oppositeExit = 8 - exit;
  return [
    (roomOnSide && directionExitsFromSpawn.has(roomOnSide, time * 2)
      ? swapExitPosition(_.first(directionExitsFromSpawn(roomOnSide, time * 2).filter(e => e[2] === oppositeExit)))
      : null) ?? pos.findClosestByPath(exit, { ignoreCreeps: true, ignoreRoads: true }),
    exit
  ] as [RoomPosition | null, T];
}

function swapExitPosition(
  arg0: [StructureSpawn, RoomPosition, ExitConstant] | null
): [StructureSpawn, RoomPosition, ExitConstant] | null {
  if (!arg0) return null;
  if (arg0[2] === FIND_EXIT_TOP || arg0[2] === FIND_EXIT_BOTTOM) {
    return [arg0[0], new RoomPosition(arg0[1].x, 49 - arg0[1].y, arg0[1].roomName), arg0[2]];
  } else {
    return [arg0[0], new RoomPosition(49 - arg0[1].x, arg0[1].y, arg0[1].roomName), arg0[2]];
  }
}

export const exits = cacheForRoom("exits", room => room.find(FIND_EXIT));
export const directionExitsFromSpawn: RoomCache<[StructureSpawn, RoomPosition, ExitConstant][]> = cacheForRoom(
  "direction exits",
  (room, time) =>
    (mySpawns(room).length === 0 ? room.find(FIND_MY_CREEPS) : mySpawns(room)).flatMap(s =>
      [
        getDirectionExitFor(room, time, s.pos, FIND_EXIT_BOTTOM),
        getDirectionExitFor(room, time, s.pos, FIND_EXIT_TOP),
        getDirectionExitFor(room, time, s.pos, FIND_EXIT_LEFT),
        getDirectionExitFor(room, time, s.pos, FIND_EXIT_RIGHT)
      ]
        .filter(e => e[0] != null)
        .map(([pos, exit]) => [s, pos, exit] as [StructureSpawn, RoomPosition, ExitConstant])
    )
);

const exitsFromRoomToRoomCache = cacheForKey<`${string}|${string}`, ExitConstant | ERR_NO_PATH | ERR_INVALID_ARGS>(
  "exits from room to room",
  fromToKey => {
    const [from, to] = fromToKey.split("|");
    return Game.rooms[from].findExitTo(to);
  }
);
export const exitsFromRoomToRoom = (
  startRoom: string,
  goalRoom: string,
  time: number
): ExitConstant | ERR_NO_PATH | ERR_INVALID_ARGS => exitsFromRoomToRoomCache(`${startRoom}|${goalRoom}`, time);
