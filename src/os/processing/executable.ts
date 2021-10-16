import { ProcessMessage } from "./messages";
import { ProcessMemory } from "./process-memory";

export abstract class Executable<TArgs = void, TResult = void> {
  public abstract readonly name: string;
  public abstract run(memoryObject: ProcessMemory, args: TArgs): ExecutableGenerator<TResult>;
}

export type ExecutableGenerator<TResult = void> = Generator<ProcessMessage<TResult>, TResult, void>;
