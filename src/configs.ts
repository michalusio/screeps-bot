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

export const FILL_PRIORITY = {
  spawn: 1,
  extension: 2,
  storage: 3,
  container: 4
};

export const EMPTY_PRIORITY = {
  spawn: 4,
  extension: 3,
  storage: 2,
  container: 2
};

export const PLACEMENT_CACHE_TIME = 10;
export const EXTENSION_PLACEMENT_RANGE_SIZE = 8;
export const ROAD_PLAZA_SIZE = 5;
export const SPAWN_ACTIVE_AREA = Math.min(EXTENSION_PLACEMENT_RANGE_SIZE, ROAD_PLAZA_SIZE);

export const NEW_COLONY_SPAWN_SIZE = 6;
