/*
 * Copyright (c) 2023, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import fs from 'fs-extra';
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';
import { setAutocrlfOnWin32 } from '../../helper/git.js';
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
  });

  after(async () => {
    await recordPerf(testName, performance);
    await session?.clean();
  });

  it('ComponentSetExtra', async () => {
    await fs.appendFile(join(session.project.dir, '.forceignore'), '\nforce-app/test');
    performance.mark('fromGitDiff');

    await ComponentSetExtra.fromGitDiff({
      ref: 'a6a873288a3a9e8e061353d521ef0aa1dcc53789..e593957756d629b4b0a8d8114889ac58f5943173',
      fsPaths: ['force-app'],
    });
    performance.measure('fromGitDiff', 'fromGitDiff');
  });
});
