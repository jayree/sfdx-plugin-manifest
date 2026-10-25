/*
 * Copyright 2026, jayree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/// <reference types="node" />
import assert from 'node:assert/strict';
import fs, { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import git from 'isomorphic-git';
import { describe, it } from 'mocha';
import { statusMatrix } from '../../../src/SDR-extra/api/statusMatrix.js';

describe('statusMatrix', () => {
  it('reports tracked, modified, and untracked files for selected paths', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sfdx-plugin-manifest-status-matrix-'));
    await git.init({ fs, dir });
    await fs.mkdir(join(dir, 'force-app'), { recursive: true });
    await fs.writeFile(join(dir, 'force-app', 'tracked.txt'), 'initial');
    await git.add({ fs, dir, filepath: 'force-app/tracked.txt' });
    await git.commit({
      fs,
      dir,
      author: { name: 'Unit Test', email: 'unit@example.com' },
      message: 'initial commit',
    });
    await fs.writeFile(join(dir, 'force-app', 'tracked.txt'), 'changed content');
    await fs.writeFile(join(dir, 'force-app', 'untracked.txt'), 'new');
    await fs.writeFile(join(dir, 'outside.txt'), 'ignored by filepaths');

    const rows = await statusMatrix({
      dir,
      ref1: 'HEAD',
      filepaths: ['force-app'],
      cache: {},
      ignored: true,
    });

    assert.deepEqual(rows, [
      ['force-app/tracked.txt', 1, 2, 1],
      ['force-app/untracked.txt', 0, 2, 0],
    ]);
  });

  it('compares two commit refs without reading the working tree', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sfdx-plugin-manifest-status-matrix-'));
    await git.init({ fs, dir });
    await fs.writeFile(join(dir, 'tracked.txt'), 'first version');
    await git.add({ fs, dir, filepath: 'tracked.txt' });
    const firstRef = await git.commit({
      fs,
      dir,
      author: { name: 'Unit Test', email: 'unit@example.com' },
      message: 'first commit',
    });
    await fs.writeFile(join(dir, 'tracked.txt'), 'second version');
    await git.add({ fs, dir, filepath: 'tracked.txt' });
    const secondRef = await git.commit({
      fs,
      dir,
      author: { name: 'Unit Test', email: 'unit@example.com' },
      message: 'second commit',
    });

    const rows = await statusMatrix({
      dir,
      ref1: firstRef,
      ref2: secondRef,
      cache: {},
    });

    assert.deepEqual(rows, [['tracked.txt', 1, 2, 2]]);
  });

  it('omits ignored untracked files unless requested and applies the late filter', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sfdx-plugin-manifest-status-matrix-'));
    await git.init({ fs, dir });
    await fs.writeFile(join(dir, '.gitignore'), 'ignored.txt\ntracked-ignored.txt\n');
    await fs.writeFile(join(dir, 'tracked-ignored.txt'), 'tracked');
    await git.add({ fs, dir, filepath: '.gitignore' });
    await git.add({ fs, dir, filepath: 'tracked-ignored.txt', force: true });
    await git.commit({
      fs,
      dir,
      author: { name: 'Unit Test', email: 'unit@example.com' },
      message: 'add ignore rule',
    });
    await fs.writeFile(join(dir, 'ignored.txt'), 'ignored');
    await fs.writeFile(join(dir, 'included.txt'), 'included');

    const filepaths = ['.gitignore', 'ignored.txt', 'included.txt', 'tracked-ignored.txt'];
    const defaultRows = await statusMatrix({ dir, cache: {}, filepaths });
    assert.deepEqual(defaultRows, [
      ['.gitignore', 1, 1, 1],
      ['included.txt', 0, 2, 0],
      ['tracked-ignored.txt', 1, 1, 1],
    ]);

    const includedRows = await statusMatrix({
      dir,
      cache: {},
      filepaths,
      ignored: true,
      filter: (filepath) => filepath === 'included.txt',
    });
    assert.deepEqual(includedRows, [['included.txt', 0, 2, 0]]);

    const allRows = await statusMatrix({ dir, cache: {}, filepaths, ignored: true });
    assert.deepEqual(allRows, [
      ['.gitignore', 1, 1, 1],
      ['ignored.txt', 0, 2, 0],
      ['included.txt', 0, 2, 0],
      ['tracked-ignored.txt', 1, 1, 1],
    ]);
  });
});
