import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const manifestPath = join(scriptDir, 'manifest.json');
const patchesDir = join(scriptDir, 'patches');
const initialize = process.argv.includes('--initialize');
const reviewOnly = process.argv.includes('--review-only');
const snapshotsDir = join(scriptDir, 'snapshots');

const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const sha256 = (content) => createHash('sha256').update(content).digest('hex');

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  return result;
};

const makePatch = (basePath, targetPath, relativeTarget) => {
  const result = run('diff', [
    '-u',
    '--label',
    `a/${relativeTarget}`,
    '--label',
    `b/${relativeTarget}`,
    basePath,
    targetPath,
  ]);
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`Could not create patch for ${relativeTarget}: ${result.stderr}`);
  }
  return result.stdout;
};

const applyPatch = (patchPath, workDir) => {
  const check = run('git', ['apply', '--check', patchPath], { cwd: workDir });
  if (check.status !== 0) {
    throw new Error(`Patch does not apply cleanly:\n${check.stderr || check.stdout}`);
  }
  const applied = run('git', ['apply', patchPath], { cwd: workDir });
  if (applied.status !== 0) {
    throw new Error(`Could not apply patch:\n${applied.stderr || applied.stdout}`);
  }
};

const assertCleanPaths = (paths) => {
  const result = run('git', ['status', '--porcelain', '--untracked-files=all', '--', ...paths], { cwd: repoRoot });
  if (result.status !== 0) throw new Error(`Could not check local changes: ${result.stderr}`);
  if (result.stdout.trim()) {
    throw new Error(
      `Refusing to overwrite local changes in:\n${result.stdout.trim()}\nCommit or stash these changes and retry.`,
    );
  }
};

const fetchSource = async ({ name, url }) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${name} from ${url}: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

const main = async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const tempDir = await mkdtemp(join(tmpdir(), 'sfdx-plugin-upstream-sync-'));
  const updates = [];

  try {
    if (reviewOnly) {
      for (const entry of manifest) {
        const source = await fetchSource(entry);
        const sourceHash = sha256(source);
        if (sourceHash === entry.sha256) {
          console.log(`${entry.name}: unchanged`);
          continue;
        }
        updates.push({ entry, sourceHash, source });
        console.log(`${entry.name}: captured upstream snapshot for manual review`);
      }
      for (const update of updates) {
        const snapshotPath = join(snapshotsDir, `${update.entry.name}.source`);
        await mkdir(dirname(snapshotPath), { recursive: true });
        await writeFile(snapshotPath, update.source);
      }
      return;
    }

    for (const entry of manifest) {
      const source = await fetchSource(entry);
      const sourceHash = sha256(source);
      const targetPath = join(repoRoot, entry.target);
      const patchPath = join(patchesDir, `${entry.name}.patch`);
      const sourcePath = join(tempDir, entry.target);
      const patchedRoot = join(tempDir, 'patched', entry.name);
      const patchedPath = join(patchedRoot, entry.target);

      await mkdir(dirname(sourcePath), { recursive: true });
      if (!initialize && sourceHash === entry.sha256) {
        console.log(`${entry.name}: unchanged`);
        continue;
      }

      if (!initialize) {
        const paths = [entry.target, 'scripts/upstream-sync/manifest.json'];
        if (entry.mode !== 'watch') paths.push(`scripts/upstream-sync/patches/${entry.name}.patch`);
        assertCleanPaths(paths);
      }

      await writeFile(sourcePath, source);

      if (entry.mode === 'watch') {
        updates.push({ entry, sourceHash, target: source, source, patch: undefined });
        console.log(`${entry.name}: upstream update captured for review; local code was not changed`);
        continue;
      }

      if (initialize) {
        const currentTarget = await readFile(targetPath);
        const patch = makePatch(sourcePath, targetPath, entry.target);
        updates.push({ entry, sourceHash, target: currentTarget, source, patch });
        console.log(`${entry.name}: baseline initialized`);
        continue;
      }

      const patch = await readFile(patchPath, 'utf8');
      await mkdir(dirname(patchedPath), { recursive: true });
      await writeFile(patchedPath, source);
      if (patch.length > 0) applyPatch(patchPath, join(tempDir, 'patched', entry.name));

      const updatedTarget = await readFile(patchedPath);
      const updatedPatch = makePatch(sourcePath, patchedPath, entry.target);
      updates.push({ entry, sourceHash, target: updatedTarget, source, patch: updatedPatch });
      console.log(`${entry.name}: upstream change integrated`);
    }

    for (const update of updates) {
      update.entry.sha256 = update.sourceHash;
      await mkdir(dirname(join(repoRoot, update.entry.target)), { recursive: true });
      await writeFile(join(repoRoot, update.entry.target), update.target);
      const snapshotPath = join(snapshotsDir, `${update.entry.name}.source`);
      await mkdir(dirname(snapshotPath), { recursive: true });
      await writeFile(snapshotPath, update.source);
      if (update.patch !== undefined) {
        await mkdir(patchesDir, { recursive: true });
        await writeFile(join(patchesDir, `${update.entry.name}.patch`), update.patch);
      }
    }
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

try {
  await main();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
