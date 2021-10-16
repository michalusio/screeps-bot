export interface ProcessMemory {
  [key: string]: number | string | Id<unknown> | null | undefined | ProcessMemory;
}
