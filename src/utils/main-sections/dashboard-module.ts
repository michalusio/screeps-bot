import { messages, pruneLogs } from '../log';
import { CreepCounter } from './creep-counting';
import { civilizationEnergyLevel } from './stages';

export function logging(creepCount: CreepCounter): void {
  pruneLogs();
  let roles: string[] = [];
  creepCount.forEach(roomCounter => roles = _.union(roles, _.keys(roomCounter.perRole)));
  roles.sort();

  const bucket = Game.cpu.bucket;
  const points = Math.floor(bucket/1000);
  let totalCreeps = 0;
  creepCount.forEach(c => totalCreeps += c.overall);
  const sumCpu = roles.map(r => Memory.roleCosts[r] || 0).reduce((a, b) => a + b, 0.0001);

  creepCount.forEach((roomCounter, roomName) => {
    const room = Game.rooms[roomName];
    const visual = room.visual;
    new Renderer(visual)
      .table(tb => {
        tb.addHeader(['Bucket'.padEnd(16, ' '), 'CPU'.padEnd(7, ' ')])
          .addRow([['★'.repeat(points), { color: 'yellow' }], formatCpu(Game.cpu.getUsed()).padStart(3, ' ')]);
      })
      .hr()
      .table(tb => {
        tb.addHeader(['Room', 'E-lvl', ...roles, 'Mode'.padEnd(9, ' ')]);
        creepCount.forEach((roomCounter, roomName) => tb.addRow([roomName, civilizationEnergyLevel(room).toString(), ...roles.map(v => roomCounter.perRole[v]?.toString() ?? '0'), room.memory.mode]));
      })
      .hr()
      .table(tb => {
        tb.addHeader(['Total role CPU  ', formatCpu(sumCpu).padEnd(7, ' ')]);
        roles.map(r => ([r, Math.floor((Memory.roleCosts[r]||0) * 100 / sumCpu)]) as [string, number])
          .forEach(([r, mr]) => tb.addRow([r, [mr + '%', { color: mr > 50 ? 'maroon' : undefined }]]));
      });

    new Renderer(visual, 'right')
      .table(tb => {
        tb.addHeader(['Message'.padEnd(64, ' '), 'Count']);
        messages.forEach(msg => tb.addRow(['' + msg.message, [msg.repeats.toString(), { color: msg.repeats > 5 ? 'red' : undefined }]]));
      })
  });
}

function formatCpu(cpu: number): string {
  return (Math.floor(cpu * 10) / 10).toString();
}

type Rect = Readonly<{
  x: number;
  y: number;
  w: number;
  h: number;
}>;

export class Renderer {

  private internals: RendererInternals;

  constructor(visual: RoomVisual, side: 'left' | 'right' = 'left') {
    this.internals = new RendererInternals(visual, { x: side === 'left' ? 0 : 30.5, y: 0, w: 35, h: 20 });
  }

  public table(action: (tableBuilder: TableBuilder) => void): this {
    action(new TableBuilder(this.internals));
    return this;
  }

  public hr(): this {
    this.internals.newLine();
    return this;
  }
}

class RendererInternals {

  private currentX = this.bounds.x;
  private currentY = this.bounds.y;
  private stack: [number, number][] = [];

  constructor(private visual: RoomVisual, private bounds: Rect) {}

  public getCurrentX(): number {
    return this.currentX;
  }

  public setCurrentX(x: number): this {
    this.currentX = x;
    return this;
  }

  public push(): this {
    this.stack.push([this.currentX, this.currentY]);
    return this;
  }

  public pop(): this {
    [this.currentX, this.currentY] = this.stack.pop() ?? [this.bounds.x, this.bounds.y];
    return this;
  }

  public text(text: string, trunc?: number | undefined, style?: TextStyle | undefined): this {
    if (trunc) {
      text = text.substr(0, trunc);
    }
    this.visual.text(text, this.currentX, this.currentY + 0.125, { align: 'left', opacity: 0.6, font: '0.5 monospace', ...(style ?? {}) });
    this.currentX += (trunc ?? text.length)/4 + 1;
    if (this.currentX > this.bounds.w + this.bounds.x) {
      this.currentX = this.bounds.x;
      this.currentY += 2;
    }
    return this;
  }

  public textWithBackground(text: string, trunc?: number | undefined, style?: TextStyle | undefined, bgStyle?: PolyStyle | undefined): this {
    this.visual.rect(this.currentX - 0.5, this.currentY - 0.5, (trunc ?? text.length) / 4 + 1, 1, { fill: '#cccccc', opacity: 0.2, ...(bgStyle ?? {}) });
    return this.text(text, trunc, style);
  }

  public newLine(): this {
    this.currentX = this.bounds.x;
    this.currentY += 1;
    return this;
  }
}

export class TableBuilder {

  private positions: [number, number][] = [];

  constructor(private renderer: RendererInternals) {}

  public addHeader(data: string[]): this {
    data.forEach(d => {
      const trunc = Math.max(d.length, 6);
      this.positions.push([this.renderer.getCurrentX(), trunc]);
      this.renderer.textWithBackground(d, trunc, undefined, { stroke: 'gray' });
    });
    this.renderer.newLine();
    return this;
  }

  public addRow(data: (string | [string, TextStyle])[]): this {
    data.forEach((d, i) => {
      this.renderer.setCurrentX(this.positions[i][0]);
      if (typeof d === 'string') {
        this.renderer.textWithBackground(d, this.positions[i][1], undefined, { stroke: 'gray' });
      }
      else {
        this.renderer.textWithBackground(d[0], this.positions[i][1], d[1], { stroke: 'gray' });
      }
    });
    this.renderer.newLine();
    return this;
  }
}
