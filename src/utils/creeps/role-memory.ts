export type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];
export type RequiredKeys<T> = Exclude<KeysOfType<T, Exclude<T[keyof T], undefined>>, undefined>;
export type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;

export interface CreepRoleMemory extends CreepMemory {
  role: string;
  newCreep?: boolean;
  state: string;
}

export interface CreepRemoteMemory extends CreepRoleMemory {
  originRoom: string;
}

export function stateChanger<T extends CreepRoleMemory & { state: string }>(
  ...clears: (OptionalKeys<T> & string)[]
): (state: T["state"], creep: Creep & { memory: T }) => void {
  return (state, creep) => {
    const memory = creep.memory;
    clears.forEach(clear => ((memory as unknown as { [key: string]: unknown })[clear] = undefined));
    if (memory.state !== state) {
      stateVisualizer(state, creep);
    }
    memory.state = state;
  };
}

function stateVisualizer(state: string, creep: Creep) {
  switch (state) {
    case "mining":
      creep.say("⛏️");
      break;
    case "conquering":
      creep.say("🗡️");
      break;
    case "getting":
      creep.say("🚚");
      break;
    case "storing":
      creep.say("📦");
      break;
    case "sourcing":
      creep.say("🔎🔋");
      break;
    case "claiming":
      creep.say("🚩");
      break;
    case "upgrading":
      creep.say("💖");
      break;
    case "building":
      creep.say("🔨");
      break;
    case "repairing":
      creep.say("🔧");
      break;
    case "fighting":
      creep.say("⚔️");
      break;
    case "scouting":
      creep.say("🔎⚔️");
      break;
    default:
      creep.room.visual.text(state, creep.pos.x, creep.pos.y - 1, {
        align: "center",
        backgroundColor: "hotpink",
        backgroundPadding: 0.15
      });
      break;
  }
}
