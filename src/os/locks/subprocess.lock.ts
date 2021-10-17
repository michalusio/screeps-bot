import { ExecutableRegistry } from "os/executable-registry";
import { Executable } from "os/processing/executable";
import { Lock } from "os/processing/lock";
import { ProcessArguments } from "os/processing/process-memento";
import { ProcessMemory } from "os/processing/process-memory";

export function Subprocess<TArgs extends ProcessArguments, TResult>(
  subprocessMemory: ProcessMemory,
  execName: string,
  args: TArgs
): Lock<TResult>;
export function Subprocess<TArgs extends ProcessArguments, TResult>(
  subprocessMemory: ProcessMemory,
  exec: Executable<TArgs, TResult>,
  args: TArgs
): Lock<TResult>;
export function* Subprocess<TArgs extends ProcessArguments, TResult>(
  subprocessMemory: ProcessMemory,
  exec: Executable<TArgs, TResult> | string,
  args: TArgs
): Lock<TResult> {
  if (typeof exec === "string") {
    const execInstance = ExecutableRegistry.instance.getExecutable(exec) as Executable<TArgs, TResult> | undefined;
    if (!execInstance) {
      throw new Error(`Executable ${exec} not found`);
    }
    return { value: yield* execInstance.run(subprocessMemory, args) };
  } else return { value: yield* exec.run(subprocessMemory, args) };
}
