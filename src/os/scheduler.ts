import { ExecutableGenerator, Process, ProcessMessage } from "./processing";

export class Scheduler {
  private readonly runningProcesses: [Process<unknown, unknown>, ExecutableGenerator<unknown>][] = [];

  public tick(): void {
    const availableTime = Game.cpu.tickLimit;

    this.runningProcesses.forEach(pr => (pr[0].priority += availableTime / this.runningProcesses.length));
    this.runningProcesses.forEach(pr => (pr[0].locks = pr[0].locks.filter(l => !l.isUnlocked())));

    while (this.runningProcesses.length > 0) {
      const processesToRun = this.runningProcesses
        .filter(pr => pr[0].locks.length === 0)
        .sort((a, b) => a[0].priority - b[0].priority);
      if (processesToRun.length === 0) {
        break;
      }
      processesToRun.forEach(pr => {
        const cpu = Game.cpu.getUsed();
        const generator = pr[1] ?? pr[0].executable.run(pr[0].args);
        pr[1] = generator;
        const result = generator.next();
        const timeSpent = Game.cpu.getUsed() - cpu;
        pr[0].totalCpu += timeSpent;
        pr[0].priority -= timeSpent;

        const message: ProcessMessage<unknown> = result.done
          ? { type: "process-end", statusCode: 0, resultValue: result.value }
          : result.value;

        switch (message.type) {
          case "process-end":
            this.runningProcesses.splice(this.runningProcesses.indexOf(pr), 1);
            // Take care of the result
            break;
          case "process-skip-tick":
            break;
        }
      });
    }
  }
}
