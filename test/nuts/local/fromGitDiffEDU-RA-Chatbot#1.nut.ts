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

describe('result testing with EDU-RA-Chatbot #1', () => {
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

  it('should return "updated dialog"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff([
      'c0e0918a5e3effb1d2774759d4798618b83251a2',
      'd68f23aa8c39e61e861454ade8f88b0715df2409',
    ]);
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({
      Package: {
        types: [
          { members: ['Mascot'], name: 'Bot' },
          { members: ['Mascot.v1'], name: 'BotVersion' },
        ],
        version: '50.0',
      },
    });
  });

  it('should fail returning "updated dialog" with wrong fsPath', async () => {
    try {
      await ComponentSetExtra.fromGitDiff({
        ref: ['c0e0918a5e3effb1d2774759d4798618b83251a2', 'd68f23aa8c39e61e861454ade8f88b0715df2409'],
        fsPaths: ['app'],
      });
      throw new Error('This test should have thrown');
    } catch (err) {
      const error = err as SfError;
      expect(error.message).to.contains('is not a valid source file path');
    }
  });

  it('should fail returning "updated dialog" with wrong multi ref', async () => {
    try {
      await ComponentSetExtra.fromGitDiff({
        ref: ['123', '456'],
        fsPaths: ['app'],
      });
      throw new Error('This test should have thrown');
    } catch (err) {
      const error = err as SfError;
      expect(error.message).to.contains("ambiguous argument '123'");
    }
  });

  it('should fail returning "updated dialog" with wrong single ref', async () => {
    try {
      await ComponentSetExtra.fromGitDiff('HEAD~111');
      throw new Error('This test should have thrown');
    } catch (err) {
      const error = err as SfError;
      expect(error.message).to.contains("ambiguous argument 'HEAD~111'");
    }
  });

  it('should fail returning "updated dialog" with wrong multi string ref', async () => {
    try {
      await ComponentSetExtra.fromGitDiff('HEAD~1....HEAD~2');
      throw new Error('This test should have thrown');
    } catch (err) {
      const error = err as SfError;
      expect(error.message).to.contains('Ambiguous arguments: HEAD~1....HEAD~2');
    }
  });
});
