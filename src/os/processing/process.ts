import { Executable } from "./executable";
import { PID } from "../types";

export class Process<T, U> {
  public readonly pid: PID;
  public priority = 0;
  public startTick?: number;
  public totalCpu = 0;

  constructor(public readonly executable: Executable<T, U>, public readonly args: T) {
    this.pid = `${Math.random()}${JSON.stringify(args)}${JSON.stringify(executable)}`.hashCode();
  }
}
