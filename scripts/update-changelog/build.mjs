import { build } from 'esbuild';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const check = process.argv.includes('--check');
const result = await build({
  absWorkingDir: scriptDir,
  entryPoints: ['release-version.mjs', 'release-changelog.mjs'],
  outdir: 'dist',
  outExtension: { '.js': '.cjs' },
  bundle: true,
  platform: 'node',
  target: 'node22',
  // Do not inherit compiler settings from a parent checkout's tsconfig.json.
  tsconfigRaw: { compilerOptions: { alwaysStrict: true } },
  format: 'cjs',
  write: false,
});

const expectedFiles = new Set(result.outputFiles.map((file) => basename(file.path)));
for (const file of await readdir(resolve(scriptDir, 'dist'))) {
  if (file.endsWith('.cjs') && !expectedFiles.has(file)) {
    throw new Error(`Obsolete bundle: dist/${file}; remove it before rebuilding.`);
  }
}

for (const file of result.outputFiles) {
  if (check) {
    const actual = await readFile(file.path).catch(() => null);
    if (!actual?.equals(file.contents)) throw new Error(`Stale bundle: ${basename(file.path)}; run yarn build.`);
  } else {
    await mkdir(dirname(file.path), { recursive: true });
    await writeFile(file.path, file.contents);
  }
}
console.log(check ? 'Release bundles match their sources and locked dependencies.' : 'Built both release hooks.');
