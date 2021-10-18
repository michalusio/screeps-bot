import { exits, getPathFromCache } from "cache/path-cache";
import { CreepRoleMemory, MoveToReturnCode } from "utils/creeps";

declare global {
  interface Creep {
    roleMemory: CreepRoleMemory;
    wander(): CreepMoveReturnCode;
    moveModifier(): number;
    travelTo(
      target: RoomPosition | _HasRoomPosition,
      avoid?: (room: Room) => RoomPosition[],
      options?: (MoveToOpts & { moveModifier?: number; ignoreContainers?: boolean }) | undefined
    ): () => MoveToReturnCode;
    travelInto(
      target: RoomPosition | _HasRoomPosition,
      avoid?: (room: Room) => RoomPosition[],
      options?: (MoveToOpts & { moveModifier?: number; ignoreContainers?: boolean }) | undefined
    ): MoveToReturnCode;
  }
}

export function injectCreepMethods(): void {
  if (!Memory.afterReset) return;

  Creep.prototype.wander = function (): CreepMoveReturnCode {
    if (!this.fatigue) {
      const direction = (Math.floor(Math.random() * 8) + 1) as DirectionConstant;
      if (!this.pos.getDirected(direction).isBorderCell()) {
        return this.move(direction);
      } else return ERR_BUSY;
    } else return ERR_TIRED;
  };

  Creep.prototype.travelTo = function (
    target: RoomPosition | _HasRoomPosition,
    avoid?: (room: Room) => RoomPosition[],
    options?: (MoveToOpts & { moveModifier?: number; ignoreContainers?: boolean }) | undefined
  ): () => MoveToReturnCode {
    const targeted = target instanceof RoomPosition ? target : target.pos;
    const hash = (this.roleMemory.role.hashCode() >> 8) & 0xffffff;
    return () => {
      if (this.pos.isNearTo(targeted)) return OK;
      if (!this.roleMemory._travel || this.pos.areEqual(_.last(this.roleMemory._travel))) {
        this.roleMemory._travel = Object.assign(
          getPathFromCache(this.pos, targeted, {
            ignoreRoads: false,
            ignoreCreeps: false,
            moveModifier: this.moveModifier(),
            range: 1,
            visualizePathStyle: { stroke: "#" + hash.toString(16) },
            ...(options ?? {})
          }).slice(0, options?.reusePath === undefined ? 8 : options?.reusePath),
          { prevPos: this.pos, waitTime: 0 }
        );
      }
      let pathMove: CreepMoveReturnCode | ERR_NO_PATH | ERR_NOT_FOUND | ERR_INVALID_ARGS | ERR_INVALID_TARGET =
        this.moveByPath(this.roleMemory._travel.map(p => new RoomPosition(p.x, p.y, p.roomName)));
      switch (pathMove) {
        case ERR_NOT_FOUND:
          this.roleMemory._travel = undefined;
          break;
        case ERR_INVALID_ARGS: {
          const addonAvoided = targeted.isBorderCell() ? [] : exits(this.room, 1000);
          const avoided = [...(avoid?.call(undefined, this.room) ?? []), ...addonAvoided];
          const costCallback = (name: string, matrix: CostMatrix) => {
            avoided.filter(a => a.roomName === name).forEach(a => matrix.set(a.x, a.y, Number.MAX_VALUE));
            return matrix;
          };
          pathMove = this.moveTo(targeted, {
            reusePath: 10,
            heuristicWeight: 1.5,
            visualizePathStyle: { stroke: "#" + hash.toString(16) },
            maxOps: 1000,
            maxRooms: 1,
            costCallback: avoid ? costCallback : undefined,
            ...(options ?? {})
          });
          break;
        }
        case OK:
          if (this.pos.areEqual(_.last(this.roleMemory._travel))) {
            this.roleMemory._travel = undefined;
          }
          break;
      }
      if (this.roleMemory._travel) {
        if (this.pos.areEqual(this.roleMemory._travel.prevPos)) {
          this.roleMemory._travel.waitTime++;
          if (this.roleMemory._travel.waitTime > 3) {
            this.roleMemory._travel = undefined;
            console.log("Miarka się przebrała");
          }
        } else {
          this.roleMemory._travel.waitTime = 0;
          this.roleMemory._travel.prevPos = this.pos;
        }
      }
      return pathMove;
    };
  };

  Creep.prototype.travelInto = function (
    target: RoomPosition | _HasRoomPosition,
    avoid?: (room: Room) => RoomPosition[],
    options?: (MoveToOpts & { moveModifier?: number; ignoreContainers?: boolean }) | undefined
  ): MoveToReturnCode {
    const targeted = target instanceof RoomPosition ? target : target.pos;
    const hash = (this.roleMemory.role.hashCode() >> 8) & 0xffffff;
    if (!this.roleMemory._travel || this.pos.areEqual(_.last(this.roleMemory._travel))) {
      this.roleMemory._travel = Object.assign(
        getPathFromCache(this.pos, targeted, {
          ignoreRoads: false,
          ignoreCreeps: false,
          moveModifier: this.moveModifier(),
          range: 0,
          visualizePathStyle: { stroke: "#" + hash.toString(16) },
          ...(options ?? {})
        }).slice(0, options?.reusePath == null ? 8 : options?.reusePath),
        { prevPos: this.pos, waitTime: 0 }
      );
    }
    let pathMove: CreepMoveReturnCode | ERR_NO_PATH | ERR_NOT_FOUND | ERR_INVALID_ARGS | ERR_INVALID_TARGET =
      this.moveByPath(this.roleMemory._travel.map(p => new RoomPosition(p.x, p.y, p.roomName)));
    switch (pathMove) {
      case ERR_NOT_FOUND:
        this.roleMemory._travel = undefined;
        break;
      case ERR_INVALID_ARGS: {
        const addonAvoided = targeted.isBorderCell() ? [] : exits(this.room, 1000);
        const avoided = [...(avoid?.call(undefined, this.room) ?? []), ...addonAvoided];
        const costCallback = (name: string, matrix: CostMatrix) => {
          avoided.filter(a => a.roomName === name).forEach(a => matrix.set(a.x, a.y, Number.MAX_VALUE));
          return matrix;
        };
        pathMove = this.moveTo(targeted, {
          reusePath: 10,
          heuristicWeight: 1.5,
          visualizePathStyle: { stroke: "#" + hash.toString(16) },
          maxOps: 1000,
          maxRooms: 1,
          costCallback: avoid ? costCallback : undefined,
          ...(options ?? {})
        });
        break;
      }
      case OK:
        if (this.pos.areEqual(_.last(this.roleMemory._travel))) {
          this.roleMemory._travel = undefined;
        }
        break;
    }
    if (this.roleMemory._travel) {
      if (this.pos.areEqual(this.roleMemory._travel.prevPos)) {
        this.roleMemory._travel.waitTime++;
        if (this.roleMemory._travel.waitTime > 3) {
          this.roleMemory._travel = undefined;
          console.log("Miarka się przebrała");
        }
      } else {
        this.roleMemory._travel.waitTime = 0;
        this.roleMemory._travel.prevPos = this.pos;
      }
    }
    return pathMove;
  };

  Creep.prototype.moveModifier = function (): number {
    return (
      (_.sum(this.body, b => (b.type === "carry" || b.type === "move" ? 0 : 1)) +
        Math.ceil(this.store.getUsedCapacity() / 50)) /
      (2 * (this.getActiveBodyparts(MOVE) ?? 1))
    );
  };

  Object.defineProperty(Creep.prototype, "roleMemory", {
    get: function roleMemory() {
      return (this as Creep).memory as CreepRoleMemory;
    }
  });
}
