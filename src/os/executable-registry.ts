import { Executable } from "./processing";

export class ExecutableRegistry {
  private readonly executables: Executable<unknown, unknown>[] = [];

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
