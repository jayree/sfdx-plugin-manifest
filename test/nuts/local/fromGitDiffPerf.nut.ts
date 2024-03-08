/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';

describe('perf testing', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/SalesforceFoundation/EDA',
      },
      devhubAuthStrategy: 'NONE',
    });
  });

  after(async () => {
    await session?.clean();
  });

  it('should return in a reasonable amount of time #1', async () => {
    const start = Date.now();
    await ComponentSetExtra.fromGitDiff(['HEAD~']);
    expect(Date.now() - start).to.be.lessThan(10_000);
  });

  // it('should return in a reasonable amount of time #2', async () => {
  //   const start = Date.now();
  //   await ComponentSetExtra.fromGitDiff('HEAD^2');
  //   expect(Date.now() - start).to.be.lessThan(10000);
  // });

  // it('should return in a reasonable amount of time #3', async () => {
  //   const start = Date.now();
  //   await ComponentSetExtra.fromGitDiff([
  //     '6636996f74cbc0ed2ff65cd8091722c3b4a7cf49',
  //     '940b1f6a827bb9ef286ef11b4e12c31abb8c6e3c',
  //   ]);
  //   expect(Date.now() - start).to.be.lessThan(60000);
  // });
});
