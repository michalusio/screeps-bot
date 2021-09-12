import { CreepCounter } from './creep-counting';
import { messages } from './log';
import { civilizationEnergyLevel } from './stages';

export function logging(creepCount: CreepCounter): void {
  const stageIndex = Memory.stageIndex ?? 0;
  const style = 'style="border: 4px double white;"';
  const style2 = 'style="border: 2px solid white;text-align:center;min-width: 64px;"';
  const firstColumn = `
  Current stage: ${stageIndex}

  Civilization level: ${Memory.civilizationLevel} (${civilizationEnergyLevel()} energy)





  <table ${style}><tr ${style}><th ${style2}>Overall</th>${_.keys(creepCount.perRole).map(value => `<th ${style2}>${value}</th>`).join('')}</tr><tr ${style}><td ${style2}>${creepCount.overall}</td>${_.keys(creepCount.perRole).map(value => `<td ${style2}>${creepCount.perRole[value]}</td>`).join('')}</tr></table>`;

  const messageDiv = `<div style="width:90%;height:90%;display:inline-block;border:2px solid blue;position:absolute;top:16px;left:calc(100% + 16px);">Messages:\n${messages.join('\n')}</div>`;

  console.log(`<div style="width:100%;height:232px;position:relative;"><div style="width:100%;height:100%;display:inline-block;">${firstColumn}</div>${messages.length ? messageDiv : ''}</div>`);
}
