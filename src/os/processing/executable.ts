import { ProcessMessage } from "./messages";

export abstract class Executable<TArgs = void, TResult = void> {
  public abstract readonly name: string;
  public abstract run(args: TArgs): ExecutableGenerator<TResult>;
}

export type ExecutableGenerator<TResult = void> = Generator<ProcessMessage<TResult>, TResult, void>;
