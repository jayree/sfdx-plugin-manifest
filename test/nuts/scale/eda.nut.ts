/*
 * Copyright 2025, jayree
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
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import fs from 'fs-extra';
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { SfProject } from '@salesforce/core';
import { RegistryAccess } from '@salesforce/source-deploy-retrieve';
import { ComponentSetExtra, GitDiffResolver, VirtualTreeContainerExtra } from '../../../src/SDR-extra/index.js';
import { setAutocrlfOnWin32 } from '../../helper/git.js';
import { GitRepo } from '../../../src/SDR-extra/shared/local/localGitRepo.js';
import { recordPerf } from './perfUtils.js';

const testName = 'eda';

describe('tests using EDA', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/SalesforceFoundation/EDA',
      },
      devhubAuthStrategy: 'NONE',
    });
    await setAutocrlfOnWin32(session.project.dir);
    await fs.appendFile(join(session.project.dir, '.forceignore'), '\nforce-app/test');
  });

  after(async () => {
    await recordPerf(testName, performance);
    await session?.clean();
  });

  it('ComponentSetExtra', async () => {
    performance.mark('ComponentSetExtra');

    await ComponentSetExtra.fromGitDiff({
      ref: 'a6a873288a3a9e8e061353d521ef0aa1dcc53789..e593957756d629b4b0a8d8114889ac58f5943173',
      fsPaths: ['force-app'],
    });
    performance.measure('ComponentSetExtra', 'ComponentSetExtra');
  });

  it('GitDiffResolver', async () => {
    performance.mark('GitDiffResolver');

    const project = await SfProject.resolve();
    const gitDiffResolver = new GitDiffResolver(project, new RegistryAccess());
    await gitDiffResolver.resolve(
      'a6a873288a3a9e8e061353d521ef0aa1dcc53789',
      'e593957756d629b4b0a8d8114889ac58f5943173',
      ['force-app'],
    );

    performance.measure('GitDiffResolver', 'GitDiffResolver');
  });

  it('VirtualTreeContainerExtra', async () => {
    performance.mark('VirtualTreeContainerExtra');

    const project = await SfProject.resolve();
    await VirtualTreeContainerExtra.fromGitRef('e593957756d629b4b0a8d8114889ac58f5943173', project.getPath(), []);

    performance.measure('VirtualTreeContainerExtra', 'VirtualTreeContainerExtra');
  });

  it('GitRepo', async () => {
    performance.mark('GitRepo');

    const project = await SfProject.resolve();
    const localRepo = GitRepo.getInstance({
      dir: project.getPath(),
      packageDirs: project.getUniquePackageDirectories(),
      registry: new RegistryAccess(),
    });
    await localRepo.getStatus('a6a873288a3a9e8e061353d521ef0aa1dcc53789', 'e593957756d629b4b0a8d8114889ac58f5943173');

    performance.measure('GitRepo', 'GitRepo');
  });
});
