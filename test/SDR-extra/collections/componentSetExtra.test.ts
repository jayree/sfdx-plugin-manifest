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
import fs, { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Lifecycle } from '@salesforce/core';
import { DestructiveChangesType } from '@salesforce/source-deploy-retrieve';
import git from 'isomorphic-git';
import { describe, it } from 'mocha';
import sinon from 'sinon';
import { ComponentSetExtra } from '../../../src/SDR-extra/collections/componentSetExtra.js';

const writeProjectJson = async (dir: string): Promise<void> => {
  await writeFile(
    join(dir, 'sfdx-project.json'),
    JSON.stringify(
      {
        packageDirectories: [{ path: 'force-app', default: true }],
        sourceApiVersion: '61.0',
      },
      null,
      2,
    ),
  );
};

const writeApexClass = async (dir: string, className: string, body = `public class ${className} {}`): Promise<void> => {
  const classDir = join(dir, 'force-app', 'main', 'default', 'classes');
  await mkdir(classDir, { recursive: true });
  await writeFile(join(classDir, `${className}.cls`), body);
  await writeFile(
    join(classDir, `${className}.cls-meta.xml`),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">',
      '    <apiVersion>61.0</apiVersion>',
      '    <status>Active</status>',
      '</ApexClass>',
    ].join('\n'),
  );
};

const addClass = async (dir: string, className: string): Promise<void> => {
  await writeApexClass(dir, className);
  await git.add({ fs, dir, filepath: `force-app/main/default/classes/${className}.cls` });
  await git.add({ fs, dir, filepath: `force-app/main/default/classes/${className}.cls-meta.xml` });
};

const commit = async (dir: string, message: string): Promise<string> =>
  git.commit({
    fs,
    dir,
    author: { name: 'Unit Test', email: 'unit@example.com' },
    message,
  });

const initProject = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), 'sfdx-plugin-manifest-component-set-extra-'));
  await git.init({ fs, dir });
  await writeProjectJson(dir);
  return dir;
};

const withCwd = async <T>(dir: string, action: () => Promise<T>): Promise<T> => {
  const previous = process.cwd();
  process.chdir(dir);
  try {
    return await action();
  } finally {
    process.chdir(previous);
  }
};

describe('ComponentSetExtra.fromGitDiff', () => {
  it('resolves added local components from a single ref', async () => {
    const dir = await initProject();
    await addClass(dir, 'Existing');
    await commit(dir, 'initial commit');
    await writeApexClass(dir, 'Added');

    const componentSet = await withCwd(dir, () =>
      ComponentSetExtra.fromGitDiff({ ref: 'HEAD', fsPaths: [join(dir, 'force-app')] }),
    );

    assert.equal(componentSet.has({ fullName: 'Added', type: 'ApexClass' }), true);
    assert.equal(componentSet.has({ fullName: 'Existing', type: 'ApexClass' }), false);
  });

  it('preserves components marked for post destructive changes', async () => {
    const dir = await initProject();
    await addClass(dir, 'Removed');
    await commit(dir, 'initial commit');
    await rm(join(dir, 'force-app', 'main', 'default', 'classes', 'Removed.cls'));
    await rm(join(dir, 'force-app', 'main', 'default', 'classes', 'Removed.cls-meta.xml'));

    const componentSet = await withCwd(dir, () =>
      ComponentSetExtra.fromGitDiff({ ref: 'HEAD', fsPaths: [join(dir, 'force-app')] }),
    );

    assert.deepEqual(componentSet.getTypesOfDestructiveChanges(), [DestructiveChangesType.POST]);
    const destructiveChanges = await componentSet.getObject(DestructiveChangesType.POST);
    assert.deepEqual(destructiveChanges.Package.types, [{ members: ['Removed'], name: 'ApexClass' }]);
  });

  it('accepts string and string-array ref inputs', async () => {
    const dir = await initProject();
    await addClass(dir, 'BaseClass');
    await commit(dir, 'base commit');
    await writeApexClass(dir, 'WorkingTreeAdded');

    const stringInput = await withCwd(dir, () => ComponentSetExtra.fromGitDiff('HEAD'));
    const arrayInput = await withCwd(dir, () => ComponentSetExtra.fromGitDiff(['HEAD']));
    const objectArrayInput = await withCwd(dir, () => ComponentSetExtra.fromGitDiff({ ref: ['HEAD'] }));

    assert.equal(stringInput.has({ fullName: 'WorkingTreeAdded', type: 'ApexClass' }), true);
    assert.equal(arrayInput.has({ fullName: 'WorkingTreeAdded', type: 'ApexClass' }), true);
    assert.equal(objectArrayInput.has({ fullName: 'WorkingTreeAdded', type: 'ApexClass' }), true);
  });

  it('emits a warning when an included diff component is not found in the selected local source paths', async () => {
    const dir = await initProject();
    const selectedPath = join(dir, 'selected-source');
    const sandbox = sinon.createSandbox();
    await mkdir(selectedPath, { recursive: true });
    await addClass(dir, 'BaseClass');
    await commit(dir, 'base commit');
    await writeApexClass(dir, 'MissingLocally');
    const warningStub = sandbox.stub(Lifecycle.getInstance(), 'emitWarning').resolves();

    try {
      const componentSet = await withCwd(dir, () =>
        ComponentSetExtra.fromGitDiff({ ref: 'HEAD', fsPaths: [selectedPath] }),
      );

      assert.equal(componentSet.size, 0);
      assert.equal(warningStub.calledWith('The component "ApexClass:MissingLocally" was not found locally.'), true);
    } finally {
      sandbox.restore();
    }
  });

  it('throws when an explicit source path does not exist', async () => {
    const dir = await initProject();

    await withCwd(dir, async () => {
      await assert.rejects(
        async () => ComponentSetExtra.fromGitDiff({ ref: 'HEAD', fsPaths: [join(dir, 'missing')] }),
        /The sourcepath ".+missing" is not a valid source file path\./,
      );
    });
  });
});
