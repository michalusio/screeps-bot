export function compress(value: CostMatrix): string {
  let compressed = "";
  let currentChar = -1;
  let currentCount = 0;

  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const char = value.get(x, y);
      if (currentChar === char && currentCount < 128) {
        currentCount++;
      } else {
        if (currentCount > 0) {
          compressed += String.fromCharCode((currentCount << 8) | char);
        }
        currentCount = 1;
        currentChar = char;
      }
    }
  }
  return compressed;
}

export function decompress(value: string): CostMatrix {
  const matrix = new PathFinder.CostMatrix();
  let x = 0;
  let y = 0;
  for (let index = 0; index < value.length; index++) {
    const count = value.charCodeAt(index) >> 8;
    const val = value.charCodeAt(index) & 255;
    for (let j = 0; j < count; j++) {
      matrix.set(x, y, val);
      y++;
      if (y >= 50) {
        y = 0;
        x++;
      }
    }
  }
  return matrix;
}
