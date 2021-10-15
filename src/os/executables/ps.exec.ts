import { Yield } from "os/locks/yield.lock";
import { Executable, ExecutableGenerator } from "os/processing/executable";
import { Scheduler } from "os/scheduler";

export class PSExecutable extends Executable<void, void> {
  public readonly oneTickScope = false;
  public readonly name = "ps";

  public *run(): ExecutableGenerator<void> {
    console.log(`${"PID".padStart(5).padEnd(7)}|${"STATE".padStart(7).padEnd(9)}`);
    console.log(Scheduler.instance.allProcesses.map(p => `${p.pid} | ${p.state}`).join("\n"));
    yield* Yield();
  }
}
