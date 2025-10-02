import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileJar } from '../src/pipeline.js';

const SAMPLE_JAR = new URL('../samples/sample.jar', import.meta.url);

test('compiles sample jar and executes add method', async (t) => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'litevm-'));
  const outFile = join(tmpDir, 'bundle.js');

  t.after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  const result = await compileJar({
    jarPath: fileURLToPath(SAMPLE_JAR),
    outFile,
    format: 'esm',
    runtimeMode: 'embedded'
  });

  assert.ok(result.classes > 0, 'expects classes to be emitted');

  const bundleContent = await readFile(outFile, 'utf8');
  assert.ok(bundleContent.length > 1000, 'bundle should be non-trivial');

  const moduleUrl = pathToFileURL(outFile);
  const runtimeModule = await import(`${moduleUrl.href}?${Date.now()}`);
  const runtime = runtimeModule.default;
  const value = runtime.invokeStatic('Sample', 'add', '(II)I', [7, 35]);
  assert.equal(value, 42);
});
