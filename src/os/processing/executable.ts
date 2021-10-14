import { ExecutableGenerator } from ".";

export abstract class Executable<TArgs, TResult> {
  public abstract readonly name: string;
  public abstract readonly oneTickScope: boolean;
  public abstract run(args: TArgs): ExecutableGenerator<TResult>;
}
