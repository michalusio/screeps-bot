import { extensionsToSpawnFrom } from "cache/structure-cache";
import { BODYPART_PRIORITY } from "configs";

declare global {
  interface StructureSpawn {
    /**
     * Start the creep spawning process. The required energy amount can be withdrawn from all spawns and extensions in the room.
     *
     * @param body An array describing the new creep’s body. Should contain 1 to 50 elements with one of these constants:
     *  * WORK
     *  * MOVE
     *  * CARRY
     *  * ATTACK
     *  * RANGED_ATTACK
     *  * HEAL
     *  * TOUGH
     *  * CLAIM
     * @param name The name of a new creep. It must be a unique creep name, i.e. the Game.creeps object should not contain another creep with the same name (hash key).
     * @param opts An object with additional options for the spawning process.
     * @returns One of the following codes:
     * ```
     * OK                       0   The operation has been scheduled successfully.
     * ERR_NOT_OWNER            -1  You are not the owner of this spawn.
     * ERR_NAME_EXISTS          -3  There is a creep with the same name already.
     * ERR_BUSY                 -4  The spawn is already in process of spawning another creep.
     * ERR_NOT_ENOUGH_ENERGY    -6  The spawn and its extensions contain not enough energy to create a creep with the given body.
     * ERR_INVALID_ARGS         -10 Body is not properly described or name was not provided.
     * ERR_RCL_NOT_ENOUGH       -14 Your Room Controller level is insufficient to use this spawn.
     * ```
     */
    spawnCreepCached(body: BodyPartConstant[], name: string, opts?: SpawnOptions | undefined): ScreepsReturnCode;
  }
}

export function injectStructureSpawnMethods(): void {
  if (!Memory.afterReset) return;

  StructureSpawn.prototype.spawnCreepCached = function (
    body: BodyPartConstant[],
    name: string,
    opts?: SpawnOptions
  ): ScreepsReturnCode {
    const extensions = extensionsToSpawnFrom(this.room, 50)
      .map(id => Game.getObjectById(id))
      .filter(o => o != null) as (StructureSpawn | StructureExtension)[];
    return this.spawnCreep(
      _.sortBy(body, part => BODYPART_PRIORITY[part]),
      name,
      { energyStructures: extensions, ...opts }
    );
  };
}
