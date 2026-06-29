import fs from 'fs';
import path from 'path';

const [, , sourceDir = 'output/imagegen/card-image-audit', mapPath = 'assets/images/CARD_PROMPTS_IMAGE2_TARGETS.json', mode = 'copy'] = process.argv;

const targets = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
let copied = 0;
let missing = 0;

for (const [generatedName, targetPath] of Object.entries(targets)) {
  const sourcePath = path.join(sourceDir, generatedName);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`MISSING ${sourcePath}`);
    missing++;
    continue;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  if (mode === 'move') {
    fs.renameSync(sourcePath, targetPath);
  } else {
    fs.copyFileSync(sourcePath, targetPath);
  }
  console.log(`${mode.toUpperCase()} ${sourcePath} -> ${targetPath}`);
  copied++;
}

console.log(`Done: ${copied} applied, ${missing} missing.`);
if (missing > 0) process.exitCode = 1;
