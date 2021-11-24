import { exits, ExtendedMoveToOpts, getPathFromCache } from "cache/path-cache";
import { CREEP_PATH_CACHE } from "configs";
import { CreepRoleMemory, MoveToReturnCode } from "utils/creeps";

type CreepMoveCode = CreepMoveReturnCode | ERR_NO_PATH | ERR_NOT_FOUND | ERR_INVALID_ARGS | ERR_INVALID_TARGET;
declare global {
  interface Creep {
    roleMemory: CreepRoleMemory;
    wander(): CreepMoveReturnCode;
    moveModifier(): number;
    travelTo(
      target: RoomPosition | _HasRoomPosition,
      avoid?: (room: Room) => RoomPosition[],
      options?: ExtendedMoveToOpts | undefined
    ): () => MoveToReturnCode;
    travelInto(
      target: RoomPosition | _HasRoomPosition,
      avoid?: (room: Room) => RoomPosition[],
      options?: ExtendedMoveToOpts | undefined
    ): MoveToReturnCode;
  }
}

export function injectCreepMethods(): void {
  if (!Memory.afterReset) return;

  Creep.prototype.wander = function (): CreepMoveReturnCode {
    if (!this.fatigue) {
      const direction = (Math.floor(Math.random() * 8) + 1) as DirectionConstant;
      try {
        if (!this.pos.getDirected(direction).isBorderCell()) {
          return this.move(direction);
        } else return ERR_BUSY;
      } catch {
        return ERR_BUSY;
      }
    } else return ERR_TIRED;
  };

  Creep.prototype.travelTo = function (
    target: RoomPosition | _HasRoomPosition,
    avoid?: (room: Room) => RoomPosition[],
    options?: ExtendedMoveToOpts | undefined
  ): () => MoveToReturnCode {
    return travelingAction(this, targeted => (this.pos.isNearTo(targeted) ? OK : undefined), 1).bind(
      undefined,
      target,
      avoid,
      options
    );
  };

  Creep.prototype.travelInto = function (
    target: RoomPosition | _HasRoomPosition,
    avoid?: (room: Room) => RoomPosition[],
    options?: ExtendedMoveToOpts | undefined
  ): MoveToReturnCode {
    return travelingAction(this, () => undefined, 0)(target, avoid, options);
  };

  Creep.prototype.moveModifier = function (): number {
    return (
      (_.sum(this.body, b => (b.type === "carry" || b.type === "move" ? 0 : 1)) +
        Math.ceil(this.store.getUsedCapacity() / 50)) /
      (2 * (this.getActiveBodyparts(MOVE) ?? 1))
    );
  };
  if (!Creep.prototype.roleMemory) {
    Object.defineProperty(Creep.prototype, "roleMemory", {
      get: function roleMemory() {
        return (this as Creep).memory as CreepRoleMemory;
      }
    });
  }
}

function travelingAction(
  creep: Creep,
  justBefore: (pos: RoomPosition) => OK | undefined,
  rangeOverride: number
): (
  target: RoomPosition | _HasRoomPosition,
  avoid?: (room: Room) => RoomPosition[],
  options?: ExtendedMoveToOpts | undefined
) => MoveToReturnCode {
  const hashStroke = "#" + ((creep.roleMemory.role.hashCode() >> 8) & 0xffffff).toString(16);
  return (
    target: RoomPosition | _HasRoomPosition,
    avoid?: (room: Room) => RoomPosition[],
    options?: ExtendedMoveToOpts | undefined
  ) => {
    if (creep.fatigue) return ERR_TIRED;
    const targeted = target instanceof RoomPosition ? target : target.pos;
    const before = justBefore(targeted);
    if (before === OK) return OK;
    if (
      !creep.roleMemory._travel ||
      creep.pos.areEqual(_.last(creep.roleMemory._travel.path)) ||
      !targeted.areEqual(creep.roleMemory._travel.target)
    ) {
      creep.roleMemory._travel = {
        path: getPath(creep, targeted, hashStroke, rangeOverride, options),
        prevPos: creep.pos,
        waitTime: 0,
        target: targeted
      };
    }
    let pathMove: CreepMoveCode = creep.moveByPath(
      creep.roleMemory._travel.path.map(p => new RoomPosition(p.x, p.y, p.roomName))
    );
    switch (pathMove) {
      case ERR_NOT_FOUND:
        creep.roleMemory._travel = undefined;
        break;
      case ERR_INVALID_ARGS: {
        const addonAvoided = targeted.isBorderCell() ? [] : exits(creep.room, 1000);
        const avoided = [...(avoid?.call(undefined, creep.room) ?? []), ...addonAvoided];
        const costCallback = (name: string, matrix: CostMatrix) => {
          avoided.filter(a => a.roomName === name).forEach(a => matrix.set(a.x, a.y, Number.MAX_VALUE));
          return matrix;
        };
        pathMove = creep.moveTo(targeted, {
          reusePath: options?.reusePath == null ? CREEP_PATH_CACHE : options?.reusePath,
          visualizePathStyle: Memory.visuals ? { stroke: hashStroke } : undefined,
          costCallback: avoid ? costCallback : undefined,
          ...(options ?? {})
        });
        break;
      }
      case OK:
        if (creep.pos.areEqual(_.last(creep.roleMemory._travel.path))) {
          creep.roleMemory._travel = undefined;
        }
        break;
    }
    if (creep.roleMemory._travel) {
      if (Memory.visuals) {
        _.forEach(
          _.groupBy(creep.roleMemory._travel.path, p => p.roomName),
          (paths, roomName) => {
            new RoomVisual(roomName).poly(paths, {
              lineStyle: "dashed",
              strokeWidth: 0.2,
              stroke: hashStroke,
              ...(options?.visualizePathStyle || {})
            });
          }
        );
      }
      if (creep.pos.areEqual(creep.roleMemory._travel.prevPos)) {
        creep.roleMemory._travel.waitTime++;
        if (creep.roleMemory._travel.waitTime > 5) {
          creep.roleMemory._travel = {
            path: getPath(creep, targeted, hashStroke, rangeOverride, options),
            prevPos: creep.pos,
            waitTime: 0,
            target: targeted
          };
          console.log(`${creep.name} has enough of this pathing`);
        }
      } else {
        creep.roleMemory._travel.waitTime = 0;
        creep.roleMemory._travel.prevPos = creep.pos;
      }
    }
    return pathMove;
  };
}

function getPath(
  creep: Creep,
  targeted: RoomPosition,
  hashStroke: string,
  rangeOverride: number,
  options: (MoveToOpts & { moveModifier?: number; ignoreContainers?: boolean }) | undefined
): RoomPosition[] {
  return getPathFromCache(creep.pos, targeted, {
    ignoreRoads: false,
    moveModifier: creep.moveModifier(),
    range: rangeOverride,
    visualizePathStyle: { stroke: hashStroke },
    ...(options ?? {}),
    ignoreCreeps: false
  }).slice(0, options?.reusePath == null ? CREEP_PATH_CACHE : options?.reusePath);
}
