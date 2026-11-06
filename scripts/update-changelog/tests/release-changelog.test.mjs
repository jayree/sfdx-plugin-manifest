import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { changelog, changelogBundle, fixture, mockFetch, runNode, scriptDir } from './helpers.mjs';

test('enriches the final release while preserving its heading and historical notes', (t) => {
  const dir = fixture(t);
  const content = changelog();
  writeFileSync(join(dir, 'CHANGELOG.md'), content);
  const calls = runNode(
    dir,
    `${mockFetch}
    require(${JSON.stringify(changelogBundle)}).preCommit({version:'6.1.0',tag:'6.1.0'})
      .then(() => console.log('RESULT=' + JSON.stringify(calls)));`,
  );
  const actual = readFileSync(join(dir, 'CHANGELOG.md'), 'utf-8');
  assert.equal(actual.split('\n')[0], content.split('\n')[0]);
  assert.equal(actual.split('## [6.0.91]')[1], content.split('## [6.0.91]')[1]);
  assert.equal(actual.match(/Upstream feature from fixture/g)?.length, 1);
  assert.equal(calls.length, 4);
});

test('prereleases leave the historical changelog untouched and make no requests', (t) => {
  const dir = fixture(t);
  const content = changelog('6.0.91');
  writeFileSync(join(dir, 'CHANGELOG.md'), content);
  const calls = runNode(
    dir,
    `${mockFetch}
    require(${JSON.stringify(changelogBundle)}).preCommit({version:'6.1.0-dev.0',tag:'6.1.0-dev.0'})
      .then(() => console.log('RESULT=' + JSON.stringify(calls)));`,
  );
  assert.deepEqual(calls, []);
  assert.equal(readFileSync(join(dir, 'CHANGELOG.md'), 'utf-8'), content);
});

test('prereleases do not require a changelog file', (t) => {
  const dir = fixture(t);
  assert.equal(
    runNode(
      dir,
      `require(${JSON.stringify(changelogBundle)}).preCommit({version:'6.1.0-dev.0'}).then(() => console.log('RESULT=true'));`,
    ),
    true,
  );
});

test('rejects a stale release heading before making requests or modifying history', (t) => {
  const dir = fixture(t);
  const content = changelog('6.0.92');
  writeFileSync(join(dir, 'CHANGELOG.md'), content);
  const result = runNode(
    dir,
    `${mockFetch}
    require(${JSON.stringify(changelogBundle)}).preCommit({version:'6.1.0'})
      .catch(error => console.log('RESULT=' + JSON.stringify({message:error.message,calls})));`,
  );
  assert.match(result.message, /does not start with release 6\.1\.0/);
  assert.deepEqual(result.calls, []);
  assert.equal(readFileSync(join(dir, 'CHANGELOG.md'), 'utf-8'), content);
});

for (const all of [false, true]) {
  test(`standalone CLI supports ${all ? '--all' : 'latest release only'} from another working directory`, (t) => {
    const dir = fixture(t);
    writeFileSync(join(dir, 'CHANGELOG.md'), changelog());
    const preload = join(dir, 'mock-fetch.cjs');
    writeFileSync(preload, mockFetch);
    const result = spawnSync(
      process.execPath,
      ['--require', preload, join(scriptDir, 'ucl.mjs'), ...(all ? ['--all'] : [])],
      {
        cwd: dir,
        encoding: 'utf-8',
        timeout: 15000,
      },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const actual = readFileSync(join(dir, 'CHANGELOG.md'), 'utf-8');
    assert.equal(actual.match(/Upstream feature from fixture/g)?.length, all ? 2 : 1);
  });
}
