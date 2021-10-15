import { Executable } from "./processing/executable";

export class ExecutableRegistry {
  private static _instance: ExecutableRegistry;
  public static get instance(): ExecutableRegistry {
    if (!ExecutableRegistry._instance) {
      ExecutableRegistry._instance = new ExecutableRegistry();
    }
    return ExecutableRegistry._instance;
  }

  private readonly executables: Executable<unknown, unknown>[] = [];

  private constructor() {
    //
  }

  public addExecutable(executable: Executable<unknown, unknown>): void {
    if (!this.executables.find(e => e.name === executable.name)) {
      this.executables.push(executable);
    }
  }

  public getExecutable(name: string): Executable<unknown, unknown> | undefined {
    return this.executables.find(e => e.name === name);
  }

  public get allExecutables(): Executable<unknown, unknown>[] {
    return [...this.executables];
  }
}
