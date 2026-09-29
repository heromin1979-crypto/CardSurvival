import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

// 전체 실행에서 멈춘 파일을 식별할 수 있도록 각 파일에 별도 프로세스와 제한 시간을 준다.
const output = path.resolve('docs/analysis/progression-execution/test-results');
await mkdir(output, { recursive: true });
const files = (await readdir('tests/unit')).filter(f => f.endsWith('.test.js')).map(f => `tests/unit/${f}`);
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < files.length) {
    const file = files[cursor++];
    const started = Date.now();
    const result = await new Promise(resolve => {
      let log = '';
      let timedOut = false;
      const child = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', file, '--maxWorkers=1'], { windowsHide: true });
      child.stdout.on('data', chunk => { log += chunk; });
      child.stderr.on('data', chunk => { log += chunk; });
      const timer = setTimeout(() => { timedOut = true; child.kill(); }, 45000);
      child.on('error', error => { log += error.message; });
      child.on('close', code => { clearTimeout(timer); resolve({ file, code, timedOut, ms: Date.now() - started, log }); });
    });
    await writeFile(path.join(output, `${path.basename(file)}.log`), result.log);
    const { log, ...summary } = result;
    results.push(summary);
    await writeFile(path.join(output, 'summary.json'), JSON.stringify(results, null, 2));
    process.stdout.write(`${result.timedOut ? 'TIMEOUT' : result.code === 0 ? 'PASS' : 'FAIL'} ${file}\n`);
  }
}
await Promise.all([worker(), worker()]);
process.exitCode = results.some(r => r.code !== 0 || r.timedOut) ? 1 : 0;
