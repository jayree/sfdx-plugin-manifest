import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { git, releaseRepo, runNode, versionBundle, writePackage } from './helpers.mjs';

const cases = [
  ['unchanged SDR', '6.0.91', '13.10.0', '6.0.92', '13.10.0', '6.0.92'],
  ['SDR downgrade', '6.0.91', '13.10.0', '6.0.92', '13.9.0', '6.0.92'],
  ['SDR patch', '6.0.91', '13.10.0', '6.0.92', '13.10.1', '6.0.92'],
  ['SDR minor', '6.0.91', '13.10.0', '6.0.92', '13.11.0', '6.1.0'],
  ['SDR major', '6.0.91', '13.10.0', '6.0.92', '14.0.0', '7.0.0'],
  ['larger conventional bump', '6.0.91', '13.10.0', '7.0.0', '13.11.0', '7.0.0'],
  ['prerelease minor', '6.0.91', '13.10.0', '6.0.92-dev.0', '13.11.0', '6.1.0-dev.0'],
  ['prerelease major', '6.0.91', '13.10.0', '6.0.92-beta.3', '14.0.0', '7.0.0-beta.3'],
  ['larger conventional prerelease', '6.0.91', '13.10.0', '7.0.0-dev.0', '13.11.0', '7.0.0-dev.0'],
  ['continuing prerelease', '6.1.0-dev.0', '13.11.0', '6.1.0-dev.1', '13.11.0', '6.1.0-dev.1'],
  ['promoting prerelease', '6.1.0-dev.1', '13.11.0', '6.1.0', '13.11.0', '6.1.0'],
];

function calculate(dir, candidate) {
  return runNode(
    dir,
    `const hook = require(${JSON.stringify(versionBundle)}); console.log('RESULT=' + JSON.stringify(hook.preVersionGeneration(${JSON.stringify(candidate)})));`,
  );
}

for (const [name, previous, previousSdr, candidate, currentSdr, expected] of cases) {
  test(name, (t) => {
    const dir = releaseRepo(t, previous, previousSdr);
    writePackage(dir, previous, currentSdr);
    const before = readFileSync(join(dir, 'package.json'), 'utf-8');
    assert.equal(calculate(dir, candidate), expected);
    // The Action owns the version write; the hook only returns its decision.
    assert.equal(readFileSync(join(dir, 'package.json'), 'utf-8'), before);
  });
}

test('supports v-prefixed release tags', (t) => {
  const dir = releaseRepo(t, '6.0.91', '13.10.0', 'v6.0.91');
  writePackage(dir, '6.0.91', '14.0.0');
  assert.equal(calculate(dir, '6.0.92'), '7.0.0');
});

test('keeps the conventional version for the first release', (t) => {
  const dir = releaseRepo(t, '6.0.91', '14.0.0', null);
  assert.equal(calculate(dir, '6.0.92'), '6.0.92');
});

test('ignores tags on unmerged branches', (t) => {
  const dir = releaseRepo(t);
  git(dir, 'checkout', '-qb', 'unmerged');
  writePackage(dir, '6.0.92', '14.0.0');
  git(dir, 'commit', '-qam', 'Unmerged release');
  git(dir, 'tag', '6.0.92');
  git(dir, 'checkout', '-q', '-');
  writePackage(dir, '6.0.91', '14.0.0');
  assert.equal(calculate(dir, '6.0.93'), '7.0.0');
});

test('rejects invalid candidate versions', (t) => {
  const dir = releaseRepo(t);
  assert.throws(() => calculate(dir, 'invalid'), /Invalid candidate version/);
});

test('rejects non-exact SDR versions', (t) => {
  const dir = releaseRepo(t);
  writePackage(dir, '6.0.91', '^14.0.0');
  assert.throws(() => calculate(dir, '6.0.92'), /Invalid @salesforce\/source-deploy-retrieve version/);
});
