import { costMatrixCache } from "cache/cost-matrix";
import { segments } from "cache/segment-cache";
import { getAllure } from "jobs/claimer";
import { Attacker } from "jobs/offence/attacker";
import { RemoteMiner } from "jobs/remote-miner";
import { ScoutData } from "utils/declarations";
import { messages, pruneLogs } from "../utils/log";
import { CreepCounter } from "./creep-counting";
import { civilizationEnergyLevel } from "./stages";

export function logging(creepCount: CreepCounter): void {
  pruneLogs();

  //showScoutVisuals();
  showAttackVisuals();
  showRemoteVisuals();
  showSpawnVisuals();

  if (!Memory.visuals) return;

  let roles: string[] = [];
  creepCount.forEach(roomCounter => (roles = _.union(roles, _.keys(roomCounter.perRole))));
  roles.sort();

  creepCount.forEach((__, roomName) => {
    const room = Game.rooms[roomName];
    if (!room || !room.memory) return;
    const visual = room.visual;
    Game.map.visual.text(room.memory.mode, new RoomPosition(25, 5, room.name), {
      fontFamily: "monospace",
      fontSize: 9,
      color: "#cccccc"
    });
    const level = room.memory.civilizationLevel;
    if (level) {
      Game.map.visual.text(level.toFixed(1), new RoomPosition(25, 45, room.name), {
        fontFamily: "monospace",
        color: "#cccccc"
      });
    }
    new Renderer(visual).table(tb => {
      tb.addHeader(["Room", "E-lvl", ...roles, "Mode".padEnd(10, " ")]);
      creepCount.forEach((roomCounter, roomName) =>
        tb.addRowConditional(Object.keys(Memory.rooms[roomName] || {}).length > 0, [
          roomName,
          civilizationEnergyLevel(Memory.rooms[roomName]?.civilizationLevel ?? 0).toString(),
          ...roles.map(v => roomCounter.perRole[v]?.toString() ?? "0"),
          Memory.rooms[roomName]?.mode ?? "none"
        ])
      );
    });

    new Renderer(visual, "right")
      .table(tb => {
        tb.addHeader(["Message".padEnd(56, " "), "Count"]);
        messages.forEach(msg =>
          tb.addRow([`${msg.message}`, [msg.repeats.toString(), { color: msg.repeats > 5 ? "red" : undefined }]])
        );
      })
      .table(tb => {
        tb.addHeader(["Segment".padEnd(14, " "), "Fullness".padEnd(14, " ")]);
        _.forEach(segments, (seg, key) => tb.addRow([key ?? "none", (seg.fullness() / 102400).toFixed(2)]));
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
  const scoutData = segments.scoutData.get();
  const sortedByDistance = _.sortBy(
    _.filter(
      scoutData,
      s =>
        s && s.ctrlLvl === 0 && Object.keys(s.enemyStructures).length === 0 && s.srcCtrlAvgDst < 99 && s.sources === 2
    ) as ScoutData[],
    s => s.srcCtrlAvgDst
  );
  if (sortedByDistance.length === 0) return;
  const [min, max] = [_.first(sortedByDistance).srcCtrlAvgDst, _.last(sortedByDistance).srcCtrlAvgDst];
  Object.keys(scoutData).forEach(roomName => {
    const data = scoutData[roomName] as ScoutData;
    Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, {
      fill: Object.keys(data.enemyStructures).length > 0 ? "#ff5555" : "#55ff55",
      opacity: Math.max(0, 0.5 - (Game.time - data.tick) / 5000)
    });
    if (
      max !== min &&
      data.ctrlLvl === 0 &&
      Object.keys(data.enemyStructures).length === 0 &&
      data.srcCtrlAvgDst < 99
    ) {
      const averageDistance = (max - data.srcCtrlAvgDst) / (max - min);
      const distHeight = Math.round(20 * averageDistance + 1);
      Game.map.visual.rect(new RoomPosition(46, Math.min(49, 50 - distHeight), roomName), 4, distHeight, {
        fill: "#00ff00",
        opacity: 1
      });
      const allure = getAllure(averageDistance, { data, key: roomName });
      const allureHeight = Math.round(20 * Math.min(1, Math.max(0, allure)) + 1);
      Game.map.visual.rect(new RoomPosition(42, 50 - allureHeight, roomName), 4, allureHeight, {
        fill: "#ffffff",
        opacity: 1
      });
    }
  });
}

function showSpawnVisuals() {
  if (!Memory.visualizer) return;
  Memory.visualizer.forEach(data => {
    const room = data.split("|")[0];
    const matrix = costMatrixCache(data as `${string}|${boolean}|${boolean}|${boolean}|${number}`, 13);
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const pos = new RoomPosition(x, y, room);
        const cost = matrix.get(pos.x, pos.y);
        Game.rooms[room].visual.rect(pos.x - 0.5, pos.y - 0.5, 1, 1, { fill: "red", opacity: Math.min(cost / 10) });
      }
    }
  });
  /*
  Memory.spawnVisualizer.forEach(room => {
    const place = placeInitialSpawn(Game.rooms[room]);
    if (place) {
      Game.rooms[room].visual.circle(place.x, place.y, { opacity: 1, fill: "blue" });
    }
    const stars: RoomPosition[] = [];
    for (let x = 3; x < 47; x++) {
      for (let y = 3; y < 47; y++) {
        if (extensionStar.canPlaceAt(new RoomPosition(x, y, room))) {
          stars.push(new RoomPosition(x, y, room));
        }
      }
    }
    const spawns = mySpawns(Game.rooms[room]);
    const sortedStars = _.sortBy(stars, pos => _.sum(spawns, s => pos.getRangeTo(s)));
    sortedStars.forEach((s, index) => {
      Game.rooms[room].visual.circle(s.x, s.y, {
        opacity: 1 - index / sortedStars.length,
        fill: "red"
      });
    });
  });*/
}
function showAttackVisuals(): void {
  Game.map.visual.poly(
    Object.keys(Game.flags)
      .filter(f => f.startsWith("Attack"))
      .sort()
      .map(f => Game.flags[f].pos),
    { opacity: 0.5, strokeWidth: 2, lineStyle: "dashed", stroke: "#ff0000" }
  );
  Object.keys(Game.creeps)
    .map(c => Game.creeps[c])
    .filter(c => !c.spawning && c.roleMemory.role === "attacker")
    .map(c => c as Attacker)
    .filter(c => c.memory.squadColor != null)
    .forEach(c => {
      Game.map.visual.circle(c.pos, {
        fill: "#ff0000",
        stroke: "#000000",
        strokeWidth: 0.3,
        opacity: 0.5,
        radius: 1.3
      });
    });
}
function showRemoteVisuals() {
  Object.keys(Game.creeps)
    .map(c => Game.creeps[c])
    .filter(c => !c.spawning && c.roleMemory.role === "remoteminer")
    .map(c => c as RemoteMiner)
    .filter(c => c.memory.originRoom && c.memory.sourceRoom)
    .forEach(c => {
      if (!c.memory.sourceRoom) return;
      const origin = new RoomPosition(25, 25, c.memory.originRoom);
      const source = new RoomPosition(25, 25, c.memory.sourceRoom);
      Game.map.visual.line(origin, source, {
        opacity: 0.5,
        color: "#ffdd00",
        width: 2,
        lineStyle: "dotted"
      });
    });
}
