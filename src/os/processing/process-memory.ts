import { ProcessArgument } from "./process-memento";

type ProcessMemoryInternal = ProcessArgument | ProcessMemory | undefined;
export interface ProcessMemory {
  [key: string]: ProcessMemoryInternal | ProcessMemoryInternal[];
}
