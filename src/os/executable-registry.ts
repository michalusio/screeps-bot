import { Executable } from "./processing/executable";
import { ProcessArguments } from "./processing/process-memento";

export class ExecutableRegistry {
  private static _instance: ExecutableRegistry;
  public static get instance(): ExecutableRegistry {
    if (!ExecutableRegistry._instance) {
      ExecutableRegistry._instance = new ExecutableRegistry();
    }
    return ExecutableRegistry._instance;
  }

  private readonly executables: Executable<ProcessArguments, unknown>[] = [];

  private constructor() {
    if (ExecutableRegistry._instance) {
      throw new Error("ExecutableRegistry is a singleton");
    }
  }

  public addExecutable(executable: Executable<ProcessArguments, unknown>): void {
    if (!this.executables.find(e => e.name === executable.name)) {
      this.executables.push(executable);
    }
  }

  public getExecutable(name: string): Executable<ProcessArguments, unknown> | undefined {
    return this.executables.find(e => e.name === name);
  }

  public get allExecutables(): Executable<ProcessArguments, unknown>[] {
    return [...this.executables];
  }
}
