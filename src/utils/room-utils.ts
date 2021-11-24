const roomRegex = /(?:^[WE]\d*0[NS]\d+$)|(?:^[WE]\d+[NS]\d*0$)|(?:^[WE]\d*[456][NS]\d*[456]$)/;
export function isRoomRemoteSafe(roomName: string): boolean {
  const match = roomRegex.exec(roomName);
  return !match;
}

export function getRoomsAround(roomName: string): string[] {
  const roomRegex = /^([WE])(\d+)([NS])(\d+)$/;
  const match = roomRegex.exec(roomName);
  if (match) {
    const rooms: string[] = [];
    const [, we, xx, ne, yy] = match;
    const x = parseInt(xx);
    const y = parseInt(yy);
    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        const remote = `${we}${x + ix}${ne}${y + iy}`;
        rooms.push(remote);
      }
    }
    return rooms;
  }
  return [];
}
