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
import fs, { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Lifecycle, NamedPackageDir, SfProject } from '@salesforce/core';
import { ComponentSet, RegistryAccess } from '@salesforce/source-deploy-retrieve';
import git from 'isomorphic-git';
import { describe, it } from 'mocha';
import sinon from 'sinon';
import { GitDiffResolver } from '../../../src/SDR-extra/resolve/gitDiffResolver.js';

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

const initRepo = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), 'sfdx-plugin-manifest-git-diff-resolver-'));
  await git.init({ fs, dir });
  return dir;
};

const project = (dir: string, sourceApiVersion = '61.0'): SfProject => {
  const packageDir = { name: 'force-app', path: 'force-app', fullPath: join(dir, 'force-app') } as NamedPackageDir;
  return {
    getPath: () => dir,
    getUniquePackageDirectories: () => [packageDir],
    resolveProjectConfig: async () => ({ sourceApiVersion }),
  } as unknown as SfProject;
};

describe('GitDiffResolver', () => {
  it('resolves changes from a single ref against the working tree', async () => {
    const dir = await initRepo();
    await addClass(dir, 'Existing');
    await commit(dir, 'initial commit');
    await writeApexClass(dir, 'Added');

    const componentSet = await new GitDiffResolver(project(dir)).resolve('HEAD', undefined);

    assert.equal(componentSet.sourceApiVersion, '61.0');
    assert.equal(componentSet.has({ fullName: 'Added', type: 'ApexClass' }), true);
    assert.equal(componentSet.has({ fullName: 'Existing', type: 'ApexClass' }), false);
  });

  it('resolves changes between two explicit refs', async () => {
    const dir = await initRepo();
    await addClass(dir, 'BaseClass');
    const baseCommit = await commit(dir, 'base commit');
    await addClass(dir, 'AddedLater');
    const headCommit = await commit(dir, 'head commit');

    const componentSet = await new GitDiffResolver(project(dir, '62.0')).resolve(baseCommit, headCommit);

    assert.equal(componentSet.sourceApiVersion, '62.0');
    assert.equal(componentSet.has({ fullName: 'AddedLater', type: 'ApexClass' }), true);
    assert.equal(componentSet.has({ fullName: 'BaseClass', type: 'ApexClass' }), false);
  });

  it('emits warnings for force-ignored paths on the resolved component set', async () => {
    const dir = await initRepo();
    await addClass(dir, 'BaseClass');
    const baseCommit = await commit(dir, 'base commit');
    await addClass(dir, 'HeadClass');
    const headCommit = await commit(dir, 'head commit');
    const resolver = new GitDiffResolver(project(dir));
    const warningStub = sinon.stub(Lifecycle.getInstance(), 'emitWarning').resolves();
    const componentSet = new ComponentSet([], new RegistryAccess());
    componentSet.forceIgnoredPaths = new Set(['force-app/main/default/classes/Ignored.cls']);
    Object.assign(resolver, {
      gitChangesAsComponentSet: async () => [componentSet],
    });

    try {
      assert.equal(await resolver.resolve(baseCommit, headCommit), componentSet);
      assert.equal(
        warningStub.calledWith('The forceignored file force-app/main/default/classes/Ignored.cls was ignored.'),
        true,
      );
    } finally {
      warningStub.restore();
    }
  });
});
