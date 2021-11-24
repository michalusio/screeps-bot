import { getPathFromCache } from "cache/path-cache";
import { mySpawns } from "cache/structure-cache";
import { RemoteMiner } from "jobs/remote-miner";
import { CreepRemoteMemory } from "utils/creeps";
import { Placement } from "./placement";

export const roadsToRemotes: Placement = {
  name: "Roads to Remotes",
  isPlaced: (room: Room) => {
    const spawns = mySpawns(room);
    const remoteMiningSpots = _.filter(
      Game.creeps,
      c => c.roleMemory.role === "remoteminer" && (c.roleMemory as CreepRemoteMemory).originRoom === room.name
    )
      .map(m => {
        const miner = m as RemoteMiner;
        return {
          sourceRoom: miner.memory.sourceRoom,
          source: miner.memory.sourcePoint
        };
      })
      .filter(m => m.source && m.sourceRoom) as { sourceRoom: string; source: RoomPosition }[];
    return remoteMiningSpots.every(source => {
      const roomPos = new RoomPosition(source.source.x, source.source.y, source.sourceRoom);
      return spawns.every(spawn => {
        return getPathFromCache(spawn, roomPos, { ignoreRoads: false, ignoreContainers: true })
          .filter(pos => !pos.isBorderCell())
          .every(pos => !Game.rooms[pos.roomName] || pos.isEqualTo(spawn) || pos.isEqualTo(roomPos) || !pos.isEmpty());
      });
    });
  },
  place: (room: Room) => {
    const spawns = mySpawns(room);
    const remoteMiningSpots = _.filter(
      Game.creeps,
      c => c.roleMemory.role === "remoteminer" && (c.roleMemory as CreepRemoteMemory).originRoom === room.name
    )
      .map(m => {
        const miner = m as RemoteMiner;
        return {
          sourceRoom: miner.memory.sourceRoom,
          source: miner.memory.sourcePoint
        };
      })
      .filter(m => m.source && m.sourceRoom) as { sourceRoom: string; source: RoomPosition }[];
    remoteMiningSpots.forEach(source => {
      const roomPos = new RoomPosition(source.source.x, source.source.y, source.sourceRoom);
      spawns.forEach(spawn => {
        getPathFromCache(spawn, roomPos, { ignoreRoads: false, ignoreContainers: true })
          .filter(
            pos =>
              Game.rooms[pos.roomName] &&
              pos.isEmpty() &&
              !pos.isBorderCell() &&
              !pos.isEqualTo(spawn) &&
              !pos.isEqualTo(roomPos)
          )
          .forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      });
    });
  }
};
