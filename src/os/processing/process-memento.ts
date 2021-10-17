import { PID } from "os/types";

export enum ProcessState {
  NOT_STARTED = "Not Started",
  RUNNING = "Running",
  SUSPENDED = "Suspended",
  FINISHED = "Finished",
  TERMINATED = "Terminated"
}

export type ProcessArgument = string | number | boolean | void | Id<unknown>;
export type ProcessArguments = ProcessArgument[];

export interface ProcessMemento {
  pid: PID;
  priority: number;
  state: ProcessState;
  startTick?: number;
  totalCpu: number;
  args: ProcessArguments;
  executable: string;
}
