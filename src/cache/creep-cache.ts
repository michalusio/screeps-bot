import { cacheForRoom } from "./cache-util";

export const creepMyAndPositions = cacheForRoom("creeps with my", room =>
  room.find(FIND_CREEPS).map(c => ({ my: c.my, pos: c.pos }))
);
