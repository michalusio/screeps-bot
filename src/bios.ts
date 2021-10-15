import { ExecutableRegistry } from "os/executable-registry";
import { Process } from "os/processing/process";
import { ProcessMemento } from "os/processing/process-memento";
import { Scheduler } from "os/scheduler";

declare global {
  // eslint-disable-next-line no-var
  var ps: () => void;

  interface String {
    hashCode(): number;
  }

  interface Memory {
    os: {
      processes: ProcessMemento[];
    };
  }
}

export function init(): void {
  if (Memory.os === undefined) {
    Memory.os = {
      processes: []
    };
  }

  global.ps = () => {
    const exec = ExecutableRegistry.instance.getExecutable("ps");
    if (!exec) {
      console.log("Cannot find 'ps'");
      return;
    }
    Scheduler.instance.queueProcess(new Process(exec));
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
