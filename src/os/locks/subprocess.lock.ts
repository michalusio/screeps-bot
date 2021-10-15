import { Executable } from "os/processing/executable";
import { Lock } from "os/processing/lock";

export function* Subprocess<TArgs, TResult>(exec: Executable<TArgs, TResult>, args: TArgs): Lock<TResult> {
  return { value: yield* exec.run(args) };
}
