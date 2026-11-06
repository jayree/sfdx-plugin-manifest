import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fixture, git, repoRoot, versionBundle } from './helpers.mjs';

test('the workflow uses separate version and changelog hooks', () => {
  const workflow = readFileSync(join(repoRoot, '.github/workflows/create-github-release.yml'), 'utf-8');
  assert.match(workflow, /pre-changelog-generation: scripts\/update-changelog\/dist\/release-version\.cjs/);
  assert.match(workflow, /pre-commit: scripts\/update-changelog\/dist\/release-changelog\.cjs/);
  const require = createRequire(import.meta.url);
  assert.deepEqual(Object.keys(require(versionBundle)), ['preVersionGeneration']);
});

test('the stored upstream patch reconstructs the complete release workflow', (t) => {
  const dir = fixture(t);
  const relativePath = '.github/workflows/create-github-release.yml';
  const target = join(dir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    readFileSync(join(repoRoot, 'scripts/upstream-sync/snapshots/salesforce-release-workflow.source')),
  );
  git(dir, 'apply', join(repoRoot, 'scripts/upstream-sync/patches/salesforce-release-workflow.patch'));
  assert.equal(readFileSync(target, 'utf-8'), readFileSync(join(repoRoot, relativePath), 'utf-8'));
});
