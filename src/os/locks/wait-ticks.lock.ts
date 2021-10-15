import { Lock } from "os/processing/lock";
import { ProcessMessageType } from "os/processing/messages";

export function* waitTicks(ticks: number): Lock<void> {
  const currentTick = Game.time;
  while (currentTick + ticks > Game.time) {
    yield {
      type: ProcessMessageType.ProcessSuspend
    };
  }
}
