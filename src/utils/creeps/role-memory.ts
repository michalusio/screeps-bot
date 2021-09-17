export type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];
export type RequiredKeys<T> = Exclude<KeysOfType<T, Exclude<T[keyof T], undefined>>, undefined>;
export type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;

export interface CreepRoleMemory extends CreepMemory {
  role: string;
  newCreep: boolean;
  state: string;
}

export function stateChanger<T extends CreepRoleMemory & { state: string; }>(...clears: OptionalKeys<T>[]): (state: T['state'], creep: Creep & { memory: T }) => void {
  return (state, creep) => {
    const memory = creep.memory;
    clears.forEach(clear => (memory as any)[clear] = undefined);
    if (memory.state !== state) {
      creep.room.visual
        .text(state, creep.pos.x, creep.pos.y - 1, { align: 'center', backgroundColor: 'gray', backgroundPadding: 0.15 });
    }
    memory.state = state;
  }
}
