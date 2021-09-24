import { CreepRoleMemory } from "../utils/creeps/role-memory";

export interface Claimer extends Creep {
  memory: ClaimerMemory;
}

export interface ClaimerMemory extends CreepRoleMemory {
  role: "claimer";

  claimedRoomName?: string;

  state: "claiming" | "idling";
}

export const claimerBody = (energyAvailable: number): BodyPartConstant[] => {
  const body: BodyPartConstant[] = [];
  let energy = energyAvailable;
  while (energy >= 180) {
    energy -= 180;
  }
  return body;
};

export const claimerMemory: ClaimerMemory = {
  newCreep: true,
  role: "claimer",
  claimedRoomName: undefined,
  state: "idling"
};

export function claimerBehavior(creep: Creep): void {
  const claimer = creep as Claimer;
  const creepMemory = claimer.memory;
  switch (creepMemory.state) {
    case "idling":
      break;
  }
}
