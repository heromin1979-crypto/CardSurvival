import path from 'node:path';
import { readPng } from './audit_combat_sprites.mjs';

const names = process.argv.slice(2);
for (const name of names) {
  const image = readPng(path.resolve(name));
  const { width, height } = image;
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i += 1) {
    if (image.pixels[i * 4 + 3] > 12) mask[i] = 1;
  }
  const queue = new Int32Array(mask.length);
  const components = [];
  for (let start = 0; start < mask.length; start += 1) {
    if (mask[start] !== 1) continue;
    let head = 0;
    let tail = 0;
    let size = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    queue[tail++] = start;
    mask[start] = 2;
    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      size += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const next = ny * width + nx;
          if (mask[next] !== 1) continue;
          mask[next] = 2;
          queue[tail++] = next;
        }
      }
    }
    if (size > 1500) components.push({
      size,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    });
  }
  const rows = Array.from({ length: 8 }, () => []);
  for (const component of components) {
    const row = Math.max(0, Math.min(7, Math.round((component.centerY / height) * 8 - 0.5)));
    rows[row].push(component);
  }
  console.log(`\n${name} major components=${components.length}`);
  rows.forEach((row, index) => {
    row.sort((a, b) => a.centerX - b.centerX);
    console.log(`${index}: ${row.length} ${row.map(item => `${Math.round(item.centerX)}:${item.size}:${item.width}x${item.height}`).join(' ')}`);
  });
  const sortedByY = [...components].sort((a, b) => a.centerY - b.centerY);
  const bands = [];
  for (const component of sortedByY) {
    const band = bands.at(-1);
    if (!band || component.centerY - band.at(-1).centerY > height / 18) bands.push([component]);
    else band.push(component);
  }
  console.log(`bands ${path.basename(name)}=${bands.length} ${bands.map(band => `${Math.round(band.reduce((sum, item) => sum + item.centerY, 0) / band.length)}:${band.length}`).join(' ')}`);
}
