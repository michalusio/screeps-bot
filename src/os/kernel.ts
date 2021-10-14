import { ExecutableRegistry } from "./executable-registry";
import { OSModule } from "./os-module";
import { Scheduler } from "./scheduler";

export class Kernel {
  public static readonly instance: Kernel = new Kernel();

  private _modules: { [key: string]: OSModule } = {};
  public static module<T extends OSModule>(name: T["name"]): T {
    return Kernel.instance._modules[name] as T;
  }

  private _executableRegistry: ExecutableRegistry = new ExecutableRegistry();
  public get executableRegistry(): ExecutableRegistry {
    return this._executableRegistry;
  }

  private _scheduler: Scheduler = new Scheduler();
  public get scheduler(): Scheduler {
    return this._scheduler;
  }

  public tick(): void {
    this._scheduler.tick();
  }
}
