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
  spawn: 0,
  extension: 10,
  road: 15,
  container: 15,
  tower: 20,

  storage: 25,
  link: 25,
  constructedWall: 25,

  rampart: 30,

  observer: 50,
  powerSpawn: 50,
  extractor: 50,
  lab: 50,
  terminal: 50,
  nuker: 50,
  factory: 50,

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

export const FILL_PRIORITY = {
  spawn: 1,
  extension: 2,
  terminal: 3,
  storage: 4,
  container: 5
};

export const EMPTY_PRIORITY = {
  spawn: 4,
  extension: 3,
  storage: 2,
  container: 2
};

export const STORAGE_QUOTAS = {
  [RESOURCE_ENERGY]: 2000000
};

export const ENERGY_NOT_EMPTY_MARK = 200;

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
export const USABLE_SPAWN_AREA = 4;
export const NEW_COLONY_SPAWN_SIZE = 6;

export const MY_CREEP_PATH_COST = 150;
export const HOSTILE_CREEP_AVOID_ZONE_SIZE = 2;

export const ATTACKER_SQUAD_SIZE = 3;
