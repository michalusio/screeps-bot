import { Base64 } from "utils/base64";

export type Color = [number, number, number, number];

export class Bitmap {
  private data: Uint8ClampedArray;
  private cached: string | null = null;

  constructor(private width: number, height: number) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  public setPixel(x: number, y: number, color: Color): void {
    this.cached = null;
    const index = (x + y * this.width) * 4;
    this.data[index + 0] = color[0];
    this.data[index + 1] = color[1];
    this.data[index + 2] = color[2];
    this.data[index + 3] = color[3];
  }

  public getPixel(x: number, y: number): Color {
    const index = (x + y * this.width) * 4;
    return [this.data[index + 0], this.data[index + 1], this.data[index + 2], this.data[index + 3]];
  }

  public getData(): string {
    if (!this.cached) {
      this.cached = Base64.encode(this.data);
    }
    return this.cached;
  }

  public copy(): Bitmap {
    const bitmap = new Bitmap(this.width, this.data.length / (this.width * 4));
    bitmap.data = this.data.slice();
    return bitmap;
  }
}

export function injectBitmap(bmp: Bitmap, name: string, info: string): string {
  const output = `<SCRIPT id="canvas-script-${name}">
(function(){
  const array = new Uint8ClampedArray([${bmp.getData()}]);
  const imageData = new ImageData(array, 50);

  if (!document.getElementById('canvas-${name}')) {
    const canvasContainer = document.getElementById('canvas-container-${name}');
    if (canvasContainer) canvasContainer.remove();
    const divEl = document.createElement('div');
    divEl.id = 'canvas-container-${name}';
    divEl.onclick = function() {
      const infoBlock = document.getElementById('canvas-info-${name}');
      infoBlock.style.opacity = infoBlock.style.opacity > 0.5  ? 0 : 1;
    };
    divEl.className = "canvas-container";
    divEl.innerHTML = '<h2>${name}</h2><div style="position:relative;"><canvas id="canvas-${name}" width="50" height="50"></canvas><div id="canvas-info-${name}" class="map-div" style="opacity:0;"></div></div>';
    document.getElementById('console-container').appendChild(divEl);
  }

  const canvas = document.getElementById('canvas-${name}');
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
  const infoBlock = document.getElementById('canvas-info-${name}');
  infoBlock.innerHTML = '${info}';
  document.getElementById('canvas-script-${name}').remove();
})()
</SCRIPT>`;
  return output;
}
