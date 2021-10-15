import { Lock } from "os/processing/lock";
import { ProcessMessageType } from "os/processing/messages";

export function* Yield(): Lock<void> {
  yield {
    type: ProcessMessageType.ProcessYield
  };
  return { value: undefined };
}
