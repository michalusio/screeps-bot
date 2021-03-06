import { cacheForKey, cacheForRoom, cacheForRoomStructKey, cacheForStruct, RoomCache } from "./cache-util";
import { costMatrixCache } from "./cost-matrix";
import { mySpawns } from "./structure-cache";

export type ExtendedMoveToOpts = MoveToOpts & { moveModifier?: number; ignoreContainers?: boolean };
type PathKey = `${number} ${number} ${string}|${number} ${number} ${string}|${boolean}${boolean}${number}`;

interface PathData {
  aPos: RoomPosition;
  bPos: RoomPosition;
  ignoreCreeps: boolean;
  ignoreRoads: boolean;
  ignoreContainers: boolean;
  moveModifier: number;
  range: number;
  visualizePathStyle?: PolyStyle;
}
interface PathDataWithKey extends PathData {
  key: PathKey;
}

const key = (x: PathData): PathKey =>
  `${x.aPos.x} ${x.aPos.y} ${x.aPos.roomName}|${x.bPos.x} ${x.bPos.y} ${x.bPos.roomName}|${x.ignoreRoads}${x.ignoreCreeps}${x.moveModifier}`;

const pathsCache = cacheForStruct<PathDataWithKey, RoomPosition[]>(
  "path cache",
  struct => {
    const pathResult = PathFinder.search(
      struct.aPos,
      { pos: struct.bPos, range: struct.range },
      {
        roomCallback: roomName =>
          costMatrixCache(
            `${roomName}|${struct.ignoreRoads}|${struct.ignoreCreeps}|${struct.ignoreContainers}|${struct.moveModifier}`,
            7
          )
      }
    );
    const path = pathResult.incomplete ? [] : pathResult.path;
    return path;
  },
  "key"
);

export function getPathFromCache(
  a: RoomPosition | _HasRoomPosition,
  b: RoomPosition | _HasRoomPosition,
  options: ExtendedMoveToOpts = {
    ignoreRoads: false,
    ignoreCreeps: true,
    ignoreContainers: false,
    range: 1,
    moveModifier: 1,
    visualizePathStyle: undefined
  }
): RoomPosition[] {
  const aPos = (a as _HasRoomPosition).pos ?? a;
  const bPos = (b as _HasRoomPosition).pos ?? b;

  const data: PathData = {
    aPos,
    bPos,
    ignoreRoads: options.ignoreRoads === undefined ? false : options.ignoreRoads,
    ignoreCreeps: options.ignoreCreeps === undefined ? true : options.ignoreCreeps,
    ignoreContainers: options.ignoreContainers === undefined ? false : options.ignoreContainers,
    moveModifier: options.moveModifier === undefined ? 1 : Math.ceil(options.moveModifier * 2) / 2,
    range: options.range === undefined ? 1 : options.range
  };
  const path = pathsCache({ ...data, key: key(data) }, 7);
  if (options.visualizePathStyle && Memory.visuals) {
    _.forEach(
      _.groupBy(path, p => p.roomName),
      (paths, roomName) => {
        new RoomVisual(roomName).poly(paths, {
          lineStyle: "dashed",
          strokeWidth: 0.2,
          ...options.visualizePathStyle
        });
      }
    );
  }
  return path;
}

function findClosestByPath<T extends FindConstant>(
  type: T,
  from: RoomPosition,
  opts: FindPathOpts
): RoomPosition | null {
  const room = Game.rooms[from.roomName];
  if (!room) return null;
  const items = room.find(type);
  if (items.length === 0) return null;
  const paths = items.map(item => [item, getPathFromCache(from, item, opts)] as [FindTypes[T], RoomPosition[]]);
  const nearestItem = minBy(paths, ([, path]) => path.length);
  if (!nearestItem) return null;
  return nearestItem[0] instanceof RoomPosition ? nearestItem[0] : nearestItem[0].pos;
}

export const exits = cacheForRoom("exits", room => room.find(FIND_EXIT));

export const directionExitFromSpawn = cacheForRoomStructKey<RoomPosition[], ExitConstant>(
  "direction exit",
  (room, exit) => {
    return (mySpawns(room).length === 0 ? room.find(FIND_MY_CREEPS) : mySpawns(room))
      .map(s => findClosestByPath(exit, s.pos, { ignoreCreeps: true, ignoreRoads: false }))
      .filter(e => e != null) as RoomPosition[];
  },
  exit => {
    switch (exit) {
      case FIND_EXIT_TOP:
        return "top";
      case FIND_EXIT_RIGHT:
        return "right";
      case FIND_EXIT_BOTTOM:
        return "bottom";
      case FIND_EXIT_LEFT:
        return "left";
    }
  }
);

export const directionExitsFromSpawn: RoomCache<[StructureSpawn | Creep, RoomPosition, ExitConstant][]> = cacheForRoom(
  "direction exits",
  room =>
    (mySpawns(room).length === 0 ? room.find(FIND_MY_CREEPS) : mySpawns(room)).flatMap(s =>
      [
        [findClosestByPath(FIND_EXIT_BOTTOM, s.pos, { ignoreCreeps: true, ignoreRoads: false }), FIND_EXIT_BOTTOM],
        [findClosestByPath(FIND_EXIT_TOP, s.pos, { ignoreCreeps: true, ignoreRoads: false }), FIND_EXIT_TOP],
        [findClosestByPath(FIND_EXIT_LEFT, s.pos, { ignoreCreeps: true, ignoreRoads: false }), FIND_EXIT_LEFT],
        [findClosestByPath(FIND_EXIT_RIGHT, s.pos, { ignoreCreeps: true, ignoreRoads: false }), FIND_EXIT_RIGHT]
      ]
        .filter(e => e[0] != null)
        .map(([pos, exit]) => [s, pos, exit] as [StructureSpawn | Creep, RoomPosition, ExitConstant])
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
