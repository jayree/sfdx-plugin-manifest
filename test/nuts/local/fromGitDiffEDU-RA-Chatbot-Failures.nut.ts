/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { SfError } from '@salesforce/core';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';

describe('failure result testing with EDU-RA-Chatbot', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/SalesforceFoundation/EDU-RA-Chatbot',
      },
      devhubAuthStrategy: 'NONE',
    });
  });

  after(async () => {
    await session?.clean();
  });

  it('should fail returning "updated dialog" with wrong fsPath', async () => {
    try {
      await ComponentSetExtra.fromGitDiff({
        ref: ['c0e0918a5e3effb1d2774759d4798618b83251a2', 'd68f23aa8c39e61e861454ade8f88b0715df2409'],
        fsPaths: ['app'],
      });
    } catch (err) {
      const error = err as SfError;
      expect(error.message).to.contains('is not a valid source file path');
    }
  });
});
