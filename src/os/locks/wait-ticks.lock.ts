import { Lock } from "os/processing";

export function* waitTicks(ticks: number): Lock<void> {
  const currentTick = Game.time;
  while (currentTick + ticks > Game.time) {
    yield {
      type: "process-skip-tick"
    };
  }
}
