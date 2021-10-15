import { Executable } from "./executable";
import { PID } from "../types";
import { ProcessState, ProcessArguments, ProcessMemento } from "./process-memento";

export class Process<TResult> {
  public readonly pid: PID;
  public priority = 0;
  public state: ProcessState = ProcessState.NOT_STARTED;

  public startTick?: number;
  public totalCpu = 0;

  public readonly executable: Executable<ProcessArguments, TResult>;
  public readonly args: ProcessArguments;

  constructor(executable: Executable<ProcessArguments, TResult>, memento: ProcessMemento);
  constructor(executable: Executable<ProcessArguments, TResult>, args: ProcessArguments);
  constructor(executable: Executable<ProcessArguments, TResult>);
  constructor(executable: Executable<ProcessArguments, TResult>, mementoOrArgs?: ProcessArguments | ProcessMemento) {
    this.executable = executable;
    if (!mementoOrArgs || Array.isArray(mementoOrArgs)) {
      this.args = mementoOrArgs;
      this.pid = `${JSON.stringify(this.executable.name)}-${Math.random()}`.hashCode();
    } else {
      const memento = mementoOrArgs;

      this.args = memento.args;
      this.pid = memento.pid;
      this.priority = memento.priority;
      this.startTick = memento.startTick;
      this.state = memento.state;
      this.totalCpu = memento.totalCpu;
    }
  }

  public toJSON(): ProcessMemento {
    return {
      ...this,
      executable: this.executable.name
    };
  }
}
