import { waitTicks } from "os/locks/wait-ticks.lock";
import { Executable, ExecutableGenerator } from "../processing";

export class ExampleExecutable extends Executable<void, void> {
  public readonly oneTickScope = false;
  public readonly name = "Example Exec";

  public *run(): ExecutableGenerator<void> {
    while (true) {
      console.log("I'm alive!");
      yield false;
      console.log("I'm alive but longer!");
      yield* waitTicks(2);
    }
  }
}
