export const ROLE_CPU_PRIORITY: { [role: string]: number } = {
  remoteminer: 9,
  claimer: 8,
  conquistadores: 7,
  builder: 6,
  upgrader: 5,
  miner: 5,
  sacrifice: 4,
  scout: 4,
  hauler: 3,
  towerbro: 1,
  defender: 1
};

export const REPAIR_PRIORITY = {
  [STRUCTURE_SPAWN]: 0,
  [STRUCTURE_EXTENSION]: 10,
  [STRUCTURE_ROAD]: 15,
  [STRUCTURE_CONTAINER]: 15,
  [STRUCTURE_TOWER]: 20,

  [STRUCTURE_STORAGE]: 25,
  [STRUCTURE_LINK]: 25,

  [STRUCTURE_RAMPART]: 30,
  [STRUCTURE_WALL]: 30,

  [STRUCTURE_OBSERVER]: 50,
  [STRUCTURE_POWER_SPAWN]: 50,
  [STRUCTURE_EXTRACTOR]: 50,
  [STRUCTURE_LAB]: 50,
  [STRUCTURE_TERMINAL]: 50,
  [STRUCTURE_NUKER]: 50,
  [STRUCTURE_FACTORY]: 50,

  invaderCore: 999,
  keeperLair: 999,
  controller: 999,
  powerBank: 999,
  portal: 999
};

export const TREATED_AS_FREE_TILE: LookConstant[] = [
  LOOK_CREEPS,
  LOOK_ENERGY,
  LOOK_RESOURCES,
  LOOK_FLAGS,
  LOOK_TOMBSTONES,
  LOOK_RUINS,
  LOOK_POWER_CREEPS
];

export const CIVILIZATION_MINIMUM_SPAWN_ENERGY = 150;
export const CIVILIZATION_STAGE_MODIFIER = 50;

export const HAUL_PRIORITY = {
  [LOOK_ENERGY]: 0,
  [LOOK_TOMBSTONES]: 1,
  [STRUCTURE_CONTAINER]: 2
};

export const FILL_PRIORITY = {
  [STRUCTURE_TOWER]: 0,
  [STRUCTURE_SPAWN]: 1,
  [STRUCTURE_EXTENSION]: 2,
  [STRUCTURE_TERMINAL]: 3,
  [STRUCTURE_STORAGE]: 4,
  [STRUCTURE_CONTAINER]: 5
};

export const EMPTY_PRIORITY = {
  [STRUCTURE_SPAWN]: 4,
  [STRUCTURE_EXTENSION]: 3,
  [STRUCTURE_STORAGE]: 2,
  [STRUCTURE_CONTAINER]: 2
};

export const STORAGE_QUOTAS = {
  [RESOURCE_ENERGY]: 2000000
};

export const ENERGY_NOT_EMPTY_MARK = 200;
export const ENERGY_NOT_EMPTY_SPAWN_MARK = 100;

export const BODYPART_PRIORITY: { [key: string]: number } = {
  [TOUGH]: 0,
  [WORK]: 1,
  [CARRY]: 2,
  [MOVE]: 3,
  [ATTACK]: 4,
  [RANGED_ATTACK]: 5,
  [HEAL]: 6,
  [CLAIM]: 7
};

export const PLACEMENT_CACHE_TIME = 10;
export const USABLE_SPAWN_AREA = 2;
export const NEW_COLONY_SPAWN_SIZE = 6;

export const CREEP_PATH_CACHE = 16;
export const MY_CREEP_PATH_COST = 255;
export const HOSTILE_CREEP_AVOID_ZONE_SIZE = 2;

export const ATTACKER_SQUAD_SIZE = 3;
