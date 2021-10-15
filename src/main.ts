import { init } from "bios";
import { ExecutableRegistry } from "os/executable-registry";
import { PSExecutable } from "os/executables/ps.exec";
import { Kernel } from "os/kernel";

init();

const exec = new PSExecutable();

ExecutableRegistry.instance.addExecutable(exec);

export const loop = Kernel.tick.bind(Kernel.instance);
