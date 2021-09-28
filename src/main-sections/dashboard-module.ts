import { messages, pruneLogs } from "../utils/log";
import { CreepCounter } from "./creep-counting";
import { civilizationEnergyLevel } from "./stages";

export function logging(creepCount: CreepCounter): void {
  pruneLogs();

  showScoutVisuals();

  if (Memory.cpu.length > 9) Memory.cpu.splice(0, Memory.cpu.length - 9);
  Memory.cpu.push(Game.cpu.getUsed());

  if (!Memory.visuals) return;

  let roles: string[] = [];
  creepCount.forEach(roomCounter => (roles = _.union(roles, _.keys(roomCounter.perRole))));
  roles.sort();

  const bucket = Game.cpu.bucket;
  const points = Math.floor(bucket / 1000);

  creepCount.forEach((_, roomName) => {
    const room = Game.rooms[roomName];
    if (!room.memory) return;
    const visual = room.visual;
    Game.map.visual.text(room.memory.mode, new RoomPosition(25, 5, room.name), {
      fontFamily: "monospace",
      color: "#cccccc"
    });
    const level = room.memory.civilizationLevel;
    if (level) {
      Game.map.visual.text(level.toFixed(1), new RoomPosition(25, 45, room.name), {
        fontFamily: "monospace",
        color: "#cccccc"
      });
    }
    new Renderer(visual)
      .table(tb => {
        tb.addHeader(["Bucket".padEnd(16, " ")]).addRow([["★".repeat(points), { color: "yellow" }]]);
      })
      .hr()
      .table(tb => {
        tb.addHeader(["Room", "E-lvl", ...roles, "Mode".padEnd(10, " ")]);
        creepCount.forEach((roomCounter, roomName) =>
          tb.addRowConditional(Object.keys(Memory.rooms[roomName]).length > 0, [
            roomName,
            civilizationEnergyLevel(Memory.rooms[roomName].civilizationLevel).toString(),
            ...roles.map(v => roomCounter.perRole[v]?.toString() ?? "0"),
            Memory.rooms[roomName].mode
          ])
        );
      })
      .hr()
      .chart(
        Memory.cpu.map((c, i) => [i, c]),
        cb =>
          cb
            .size(10, 5)
            .scaling(1, 1 / 5)
            .lineAt(20, "20")
            .lineAt(0, "0")
            .render()
      );

    new Renderer(visual, "right").table(tb => {
      tb.addHeader(["Message".padEnd(56, " "), "Count"]);
      messages.forEach(msg =>
        tb.addRow([`${msg.message}`, [msg.repeats.toString(), { color: msg.repeats > 5 ? "red" : undefined }]])
      );
    });
  });
}

type Rect = Readonly<{
  x: number;
  y: number;
  w: number;
  h: number;
}>;

export class Renderer {
  private internals: RendererInternals;

  constructor(visual: RoomVisual, side: "left" | "right" = "left") {
    this.internals = new RendererInternals(visual, { x: side === "left" ? 0 : 32.5, y: 0, w: 40, h: 20 });
  }

  public table(action: (tableBuilder: TableBuilder) => void): this {
    action(new TableBuilder(this.internals));
    return this;
  }

  public chart(data: [number, number][], action: (chartBuilder: ChartBuilder) => void): this {
    action(new ChartBuilder(this.internals, data));
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

  public getCurrentY(): number {
    return this.currentY;
  }

  public setCurrentX(x: number): this {
    this.currentX = x;
    return this;
  }

  public setCurrentY(y: number): this {
    this.currentY = y;
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

  public text(text: string, trunc?: number | undefined, style?: TextStyle): this {
    if (trunc) {
      text = text.substr(0, trunc);
    }
    this.visual.text(text, this.currentX, this.currentY + 0.125, {
      align: "left",
      opacity: 0.6,
      font: "0.5 monospace",
      ...(style ?? {})
    });
    this.currentX += (trunc ?? text.length) / 4 + 1;
    if (this.currentX > this.bounds.w + this.bounds.x) {
      this.currentX = this.bounds.x;
      this.currentY += 2;
    }
    return this;
  }

  public textWithBackground(text: string, trunc?: number, style?: TextStyle, bgStyle?: PolyStyle): this {
    this.visual.rect(this.currentX - 0.5, this.currentY - 0.5, (trunc ?? text.length) / 4 + 1, 1, {
      fill: "#cccccc",
      opacity: 0.2,
      ...(bgStyle ?? {})
    });
    return this.text(text, trunc, style);
  }

  public rect(w: number, h: number, style?: PolyStyle): this {
    this.visual.rect(this.currentX, this.currentY, w, h, {
      fill: "#cccccc",
      opacity: 0.2,
      ...(style ?? {})
    });
    return this;
  }

  public line(a: [number, number], b: [number, number], style?: LineStyle): this {
    this.visual.line(a[0], a[1], b[0], b[1], {
      width: 0.05,
      ...(style ?? {})
    });
    return this;
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
      this.renderer.textWithBackground(d, trunc, undefined, { stroke: "gray" });
    });
    this.renderer.newLine();
    return this;
  }

  public addRow(data: (string | [string, TextStyle])[]): this {
    data.forEach((d, i) => {
      this.renderer.setCurrentX(this.positions[i][0]);
      if (typeof d === "string") {
        this.renderer.textWithBackground(d, this.positions[i][1], undefined, { stroke: "gray" });
      } else {
        this.renderer.textWithBackground(d[0], this.positions[i][1], d[1], { stroke: "gray" });
      }
    });
    this.renderer.newLine();
    return this;
  }

  public addRowConditional(check: boolean, data: (string | [string, TextStyle])[]): this {
    if (check) return this.addRow(data);
    return this;
  }
}

export class ChartBuilder {
  private w = 0;
  private h = 0;
  private scaleW = 1;
  private scaleH = 1;

  constructor(private renderer: RendererInternals, private data: [number, number][]) {}

  public size(w: number, h: number): this {
    this.w = w;
    this.h = h;
    this.renderer
      .push()
      .setCurrentX(this.renderer.getCurrentX() - 0.5)
      .setCurrentY(this.renderer.getCurrentY() - 0.5)
      .rect(this.w + 1.5, this.h + 1, {
        fill: "#cccccc",
        stroke: "gray"
      })
      .pop()
      .rect(this.w, this.h, {
        fill: undefined,
        stroke: "gray"
      });
    return this;
  }

  public scaling(scaleW: number, scaleH: number): this {
    this.scaleW = scaleW;
    this.scaleH = scaleH;
    return this;
  }

  public lineAt(y: number, label: string): this {
    const calcY = this.renderer.getCurrentY() + this.h - y * this.scaleH;
    this.renderer
      .line([0, calcY], [this.w, calcY], {
        color: "white",
        lineStyle: "dashed",
        width: 0.05
      })
      .push()
      .setCurrentX(this.w + 0.25)
      .setCurrentY(calcY)
      .text(label, undefined, {
        align: "left",
        opacity: 0.6,
        font: "0.5 monospace"
      })
      .pop();
    return this;
  }

  public render(): this {
    this.data
      .map((d, i) => [d, this.data[Math.max(0, i - 1)]] as [[number, number], [number, number]])
      .forEach(([a, b]) =>
        this.renderer.line(
          [a[0] * this.scaleW, this.renderer.getCurrentY() + this.h - a[1] * this.scaleH],
          [b[0] * this.scaleW, this.renderer.getCurrentY() + this.h - b[1] * this.scaleH]
        )
      );
    return this;
  }
}
function showScoutVisuals() {
  const sortedByDistance = _.sortBy(
    _.filter(
      Memory.scoutData,
      s =>
        s.controllerLvl === 0 &&
        Object.keys(s.enemyStructures).length === 0 &&
        s.sourcesControllerAverageDistance < 99 &&
        s.sources === 2
    ),
    s => s.sourcesControllerAverageDistance
  );
  const [min, max] = [
    _.first(sortedByDistance).sourcesControllerAverageDistance,
    _.last(sortedByDistance).sourcesControllerAverageDistance
  ];
  Object.keys(Memory.scoutData).forEach(roomName => {
    const data = Memory.scoutData[roomName];
    Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, {
      fill: Object.keys(data.enemyStructures).length > 0 ? "#ff5555" : "#55ff55",
      opacity: Math.max(0, 0.5 - (Game.time - data.tick) / 5000)
    });
    if (
      max !== min &&
      data.controllerLvl === 0 &&
      Object.keys(data.enemyStructures).length === 0 &&
      data.sourcesControllerAverageDistance < 99
    ) {
      const averageDistance = (max - data.sourcesControllerAverageDistance) / (max - min);
      const distHeight = Math.round(20 * averageDistance + 1);
      Game.map.visual.rect(new RoomPosition(46, 50 - distHeight, roomName), 4, distHeight, {
        fill: "#00ff00",
        opacity: 1
      });
      const allure =
        averageDistance * 0.5 +
        Math.min(10, _.sum(data.enemies)) * -0.1 +
        data.sources * 0.2 +
        data.swampRatio * -0.1 +
        Math.abs(data.wallRatio - 0.3) * -0.1;
      const allureHeight = Math.round(20 * Math.min(1, Math.max(0, allure)) + 1);
      Game.map.visual.rect(new RoomPosition(42, 50 - allureHeight, roomName), 4, allureHeight, {
        fill: "#ffffff",
        opacity: 1
      });
    }
  });
}
