import { ExecutableRegistry } from "os/executable-registry";
import { Process } from "os/processing/process";
import { ProcessMemento } from "os/processing/process-memento";
import { ProcessMemory } from "os/processing/process-memory";
import { Scheduler } from "os/scheduler";
import { PID } from "os/types";

declare global {
  // eslint-disable-next-line no-var
  var run: (command: string) => string;

  interface String {
    hashCode(): number;
  }

  interface Memory {
    os: {
      processes: ProcessMemento[];
      processMemory: { [key: PID]: ProcessMemory };
    };
  }
}

export function init(): void {
  if (Memory.os === undefined) {
    Memory.os = {
      processes: [],
      processMemory: {}
    };
  }

  global.run = (command: string): string => {
    const data = command.split(" ");
    if (data.length === 0) {
      return "No command given";
    }
    const exec = ExecutableRegistry.instance.getExecutable(data[0]);
    if (!exec) {
      return `Cannot find '${data[0]}'`;
    }
    Scheduler.instance.queueProcess(new Process(exec, data.slice(1)));
    return "OK";
  };

  String.prototype.hashCode = function (): number {
    return Array.from(this).reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0);
  };
}

export const nonenumerable: {
  (target: unknown, name: string): void;
} = (target: unknown, name: string): void => {
  Object.defineProperty(target, name, {
    set(value: unknown) {
      Object.defineProperty(this, name, {
        value,
        writable: true,
        configurable: true
      });
    },
    configurable: true
  });
};
