import { Executable, ExecutableGenerator } from "./executable";
import { ProcessMemory } from "./process-memory";

export abstract class CreepExecutable<T extends Creep> extends Executable<[Id<Creep>]> {
  public *run(memory: ProcessMemory, args: [Id<T>]): ExecutableGenerator {
    let creep = Game.getObjectById(args[0]);
    if (!creep) return;
    const generator = this.runCreep(creep, memory);
    while (creep) {
      creep = Game.getObjectById(args[0]);
      const result = generator.next();
      if (result.done) return result.value;
      yield result.value;
    }
  }

  protected abstract runCreep(creep: T, memory: T["memory"]): ExecutableGenerator;
}
