import { ProcessMessage } from "./messages";

export abstract class Executable<TArgs, TResult> {
  public abstract readonly name: string;
  public abstract readonly oneTickScope: boolean;
  public abstract run(args: TArgs): ExecutableGenerator<TResult>;
}

export type ExecutableGenerator<TResult> = Generator<ProcessMessage<TResult>, TResult, void>;
