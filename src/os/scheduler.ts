import { ExecutableRegistry } from "./executable-registry";
import { MinimumHeap } from "./min-heap";
import { ExecutableGenerator } from "./processing/executable";
import { ProcessMessage, ProcessMessageType } from "./processing/messages";
import { Process } from "./processing/process";
import { ProcessState } from "./processing/process-memento";

type RunningProcess<TResult> = [Process<TResult>, ExecutableGenerator<TResult>];

enum SchedulerAction {
  Keep,
  Suspend,
  Remove
}

export class Scheduler {
  private static _instance: Scheduler;
  public static get instance(): Scheduler {
    if (!Scheduler._instance) {
      Scheduler._instance = new Scheduler();
    }
    return Scheduler._instance;
  }

  private _runningProcessesHeap: MinimumHeap<RunningProcess<unknown>> = new MinimumHeap<RunningProcess<unknown>>(a => {
    const process = a[0];
    return (
      -process.priority +
      process.totalCpu -
      -(process.state === ProcessState.RUNNING || process.state === ProcessState.NOT_STARTED ? 1000 : 0)
    );
  });

  private _suspendedProcesses: RunningProcess<unknown>[] = [];

  private constructor() {
    if (Scheduler._instance) {
      throw new Error("Scheduler is a singleton");
    }
    const remadeProcesses = Memory.os.processes
      .map(memento => {
        const exec = ExecutableRegistry.instance.getExecutable(memento.executable);
        if (!exec) return null;
        return new Process(exec, memento);
      })
      .filter(pr => pr != null) as Process<unknown>[];

    this._suspendedProcesses = remadeProcesses
      .filter(pr => pr.state === ProcessState.SUSPENDED)
      .map(pr => [pr, pr.executable.run(pr.args)] as RunningProcess<unknown>);

    remadeProcesses.filter(pr => pr.state !== ProcessState.SUSPENDED).forEach(pr => this.queueProcess(pr));
  }

  public queueProcess(process: Process<unknown>): void {
    this._runningProcessesHeap.insert([process, process.executable.run(process.args)]);
    process.state = ProcessState.RUNNING;
    process.startTick = Game.time;
  }

  public get anyProcesses(): boolean {
    return this._runningProcessesHeap.heap.length > 0 || this._suspendedProcesses.length > 0;
  }

  public get allProcesses(): Process<unknown>[] {
    return this._runningProcessesHeap.heap.map(pr => pr[0]).concat(this._suspendedProcesses.map(pr => pr[0]));
  }

  public tick(): void {
    let workItem: RunningProcess<unknown> | undefined;
    while ((workItem = this._runningProcessesHeap.getMin()) !== undefined) {
      const process = workItem[0];

      if (process.state === ProcessState.NOT_STARTED) {
        process.state = ProcessState.RUNNING;
      }

      const action = this.runProcess(workItem);

      this._runningProcessesHeap.remove();
      switch (action) {
        case SchedulerAction.Keep:
          this._runningProcessesHeap.insert(workItem);
          break;
        case SchedulerAction.Suspend:
          this._suspendedProcesses.push(workItem);
          break;
        case SchedulerAction.Remove:
          break;
      }
      this.saveProcessTable();
    }

    this._suspendedProcesses.forEach(pr => this._runningProcessesHeap.insert(pr));
    this._suspendedProcesses = [];
    this.saveProcessTable();
  }

  private runProcess(pr: RunningProcess<unknown>): SchedulerAction {
    const cpu = Game.cpu.getUsed();

    const [process, generator] = pr;

    const result = generator.next();
    const timeSpent = Game.cpu.getUsed() - cpu;
    process.totalCpu += timeSpent;

    const message: ProcessMessage<unknown> = result.done
      ? { type: ProcessMessageType.ProcessEnd, statusCode: 0, resultValue: result.value }
      : result.value;

    switch (message.type) {
      case ProcessMessageType.ProcessEnd:
        process.state = ProcessState.FINISHED;
        return SchedulerAction.Remove;
      case ProcessMessageType.ProcessSuspend:
        process.state = ProcessState.SUSPENDED;
        return SchedulerAction.Suspend;
      case ProcessMessageType.ProcessYield:
        return SchedulerAction.Keep;
    }
  }

  private saveProcessTable(): void {
    Memory.os.processes = this._runningProcessesHeap.heap
      .map(pr => pr[0].toJSON())
      .concat(this._suspendedProcesses.map(pr => pr[0].toJSON()));
  }
}
