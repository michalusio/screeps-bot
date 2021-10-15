import { OSModule } from "./os-module";
import { Scheduler } from "./scheduler";

export class Kernel {
  private static _instance: Kernel;
  public static get instance(): Kernel {
    if (!Kernel._instance) {
      Kernel._instance = new Kernel();
    }
    return Kernel._instance;
  }

  private constructor() {
    if (Kernel._instance) {
      throw new Error("Kernel is a singleton");
    }
  }

  private _modules: { [key: string]: OSModule } = {};
  public static module<T extends OSModule>(name: T["name"]): T {
    return Kernel.instance._modules[name] as T;
  }

  public static tick(): void {
    Scheduler.instance.tick();
  }
}
