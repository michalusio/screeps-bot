import { messages } from '../log';
import { CreepCounter } from './creep-counting';
import { civilizationEnergyLevel } from './stages';

export function logging(creepCount: CreepCounter): void {
  let roles: string[] = [];
  creepCount.forEach(roomCounter => roles = _.union(roles, _.keys(roomCounter.perRole)));

  const style = 'style="border: 4px double white;"';
  const style2 = 'style="border: 2px solid white;text-align:center;min-width: 64px;"';

  let rows: string = '';
  creepCount.forEach((room, roomName) => rows += `<tr ${style}><td ${style2}>${roomName}</td><td ${style2}>${civilizationEnergyLevel(roomName)}</td><td ${style2}>${room.overall}</td>${roles.map(value => `<td ${style2}>${room.perRole[value] ?? 0}</td>`).join('')}</tr>`);

  const firstColumn = `
  <table ${style}><tr ${style}><th ${style2}>Room</th><th ${style2}>E-Level</th><th ${style2}>Total</th>${roles.map(value => `<th ${style2}>${value}</th>`).join('')}</tr>${rows}</table>`;

  const messageDiv = `<div style="width:90%;height:90%;display:inline-block;border:2px solid blue;position:absolute;top:16px;left:calc(100% + 16px);">Messages:\n${messages.join('\n')}</div>`;

  console.log(`<div style="width:100%;height:232px;position:relative;"><div style="width:100%;height:100%;display:inline-block;">${firstColumn}</div>${messages.length ? messageDiv : ''}</div>`);
}
