import { messages, pruneLogs } from '../log';
import { CreepCounter } from './creep-counting';
import { civilizationEnergyLevel } from './stages';

export function logging(creepCount: CreepCounter): void {
  pruneLogs();
  let roles: string[] = [];
  creepCount.forEach(roomCounter => roles = _.union(roles, _.keys(roomCounter.perRole)));
  roles.sort();
  const style = 'style="border: 4px double white;"';
  const style2 = 'style="border: 2px solid white;text-align:center;padding: 0 4px;"';

  let rows: string = '';
  creepCount.forEach((room, roomName) => rows += `<tr ${style}><td ${style2}>${roomName}</td><td ${style2}>${civilizationEnergyLevel(roomName)}</td>${roles.map(value => `<td ${style2}>${room.perRole[value] ?? 0}</td>`).join('')}</tr>`);

  const firstColumn = `Bucket: ${bucketFormat()}
  <table ${style}><tr ${style}><th ${style2}>Room</th><th ${style2}>E-Lvl</th>${roles.map(value => `<th ${style2}>${value}</th>`).join('')}</tr>${rows}</table>`;

  const messageDiv = `<div style="width:90%;height:90%;display:inline-block;border:2px solid blue;position:absolute;top:16px;left:calc(100% + 16px);">Messages:\n${messages.map(m => m[0]).join('\n')}</div>`;

  console.log(`<div style="width:100%;height:232px;position:relative;"><div style="width:100%;height:100%;display:inline-block;">${firstColumn}</div>${messages.length ? messageDiv : ''}</div>`);
}

function bucketFormat(): string {
  const bucket = Game.cpu.bucket;
  const points = Math.floor(bucket/1000);
  return '<span style="color:yellow">★</span>'.repeat(points)+'<span style="color:red">☆</span>'.repeat(10 - points);
}
