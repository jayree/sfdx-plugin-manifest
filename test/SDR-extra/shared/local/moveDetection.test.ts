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
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Lifecycle } from '@salesforce/core';
import { RegistryAccess } from '@salesforce/source-deploy-retrieve';
import git from 'isomorphic-git';
import { describe, it } from 'mocha';
import sinon from 'sinon';
import { filenameMatchesToMap, getLogMessage } from '../../../../src/SDR-extra/shared/local/moveDetection.js';

describe('getLogMessage', () => {
  it('formats full and modified move matches', () => {
    const oldPath = join('force-app', 'classes', 'Old.cls');
    const newPath = join('force-app', 'classes', 'New.cls');
    const originalPath = join('force-app', 'classes', 'Original.cls');
    const changedPath = join('force-app', 'classes', 'Changed.cls');

    const messages = getLogMessage({
      fullMatches: new Map([['force-app/classes/New.cls', 'force-app/classes/Old.cls']]),
      deleteOnly: new Map([['force-app/classes/Changed.cls', 'force-app/classes/Original.cls']]),
    });

    assert.deepEqual(messages, [
      `The file ${oldPath} moved to ${newPath} was ignored.`,
      `The file ${originalPath} moved to ${changedPath} and modified was processed.`,
    ]);
  });
});

describe('filenameMatchesToMap', () => {
  const writeApexClass = async (filepath: string, body: string): Promise<void> => {
    await fs.mkdir(join(filepath, '..'), { recursive: true });
    await fs.writeFile(filepath, body);
  };

  const initRepoWithClass = async (classBody: string): Promise<{ dir: string; oldPath: string }> => {
    const dir = await mkdtemp(join(tmpdir(), 'sfdx-plugin-manifest-move-detection-'));
    const oldPath = join(dir, 'force-app', 'main', 'default', 'classes', 'MyClass.cls');

    await git.init({ fs, dir });
    await writeApexClass(oldPath, classBody);
    await git.add({ fs, dir, filepath: 'force-app/main/default/classes/MyClass.cls' });
    await git.commit({
      fs,
      dir,
      author: { name: 'Unit Test', email: 'unit@example.com' },
      message: 'initial commit',
    });

    return { dir, oldPath };
  };

  it('maps files moved without content changes as full matches', async () => {
    const classBody = 'public class MyClass {}';
    const { dir, oldPath } = await initRepoWithClass(classBody);
    const newPath = join(dir, 'force-app', 'other', 'default', 'classes', 'MyClass.cls');
    await fs.rm(oldPath);
    await writeApexClass(newPath, classBody);

    const matches = await filenameMatchesToMap(new RegistryAccess())(dir)({
      added: new Set([newPath]),
      deleted: new Set([oldPath]),
    });

    assert.deepEqual(matches.fullMatches, new Map([[newPath, oldPath]]));
    assert.deepEqual(matches.deleteOnly, new Map());
  });

  it('maps moved files with content changes as delete-only matches', async () => {
    const { dir, oldPath } = await initRepoWithClass('public class MyClass {}');
    const newPath = join(dir, 'force-app', 'other', 'default', 'classes', 'MyClass.cls');
    await fs.rm(oldPath);
    await writeApexClass(newPath, 'public class MyClass { void changed() {} }');

    const matches = await filenameMatchesToMap(new RegistryAccess())(dir)({
      added: new Set([newPath]),
      deleted: new Set([oldPath]),
    });

    assert.deepEqual(matches.fullMatches, new Map());
    assert.deepEqual(matches.deleteOnly, new Map([[newPath, oldPath]]));
  });

  it('returns no matches when either side of the move set is empty', async () => {
    const { dir, oldPath } = await initRepoWithClass('public class MyClass {}');

    const matches = await filenameMatchesToMap(new RegistryAccess())(dir)({
      added: new Set(),
      deleted: new Set([oldPath]),
    });

    assert.deepEqual(matches.fullMatches, new Map());
    assert.deepEqual(matches.deleteOnly, new Map());
  });

  it('warns and ignores ambiguous duplicate move matches', async () => {
    const classBody = 'public class MyClass {}';
    const { dir, oldPath } = await initRepoWithClass(classBody);
    const newPath = join(dir, 'force-app', 'other', 'default', 'classes', 'MyClass.cls');
    const duplicatePath = join(dir, 'force-app', 'duplicate', 'default', 'classes', 'MyClass.cls');
    const sandbox = sinon.createSandbox();
    await fs.rm(oldPath);
    await writeApexClass(newPath, classBody);
    await writeApexClass(duplicatePath, classBody);
    const warningStub = sandbox.stub(Lifecycle.getInstance(), 'emitWarning').resolves();

    try {
      const matches = await filenameMatchesToMap(new RegistryAccess())(dir)({
        added: new Set([newPath, duplicatePath]),
        deleted: new Set([oldPath]),
      });

      assert.deepEqual(matches.fullMatches, new Map());
      assert.deepEqual(matches.deleteOnly, new Map());
      assert.equal(
        warningStub.calledWith('Files were found that have the same basename, hash, metadata type, and parent.'),
        true,
      );
    } finally {
      sandbox.restore();
    }
  });

  it('normalizes CRLF content for added files when core.autocrlf is true', async () => {
    const { dir, oldPath } = await initRepoWithClass('public class MyClass {}\n');
    const newPath = join(dir, 'force-app', 'other', 'default', 'classes', 'MyClass.cls');
    await git.setConfig({ fs, dir, path: 'core.autocrlf', value: 'true' });
    await fs.rm(oldPath);
    await writeApexClass(newPath, 'public class MyClass {}\r\n');

    const matches = await filenameMatchesToMap(new RegistryAccess())(dir)({
      added: new Set([newPath]),
      deleted: new Set([oldPath]),
    });

    assert.deepEqual(matches.fullMatches, new Map([[newPath, oldPath]]));
    assert.deepEqual(matches.deleteOnly, new Map());
  });
});
