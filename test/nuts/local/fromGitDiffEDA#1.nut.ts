/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';

describe('result testing with EDA #1', () => {
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

  it('should return "Added new custom labels"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff({
      ref: '48a560bbb507e82dca0caac53024ccf60ecda7fb..83e42ae2b162833a98121a147e00b93feb3784aa',
    });
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({
      Package: {
        types: [
          {
            members: [
              'stgReleaseGateActivateLatest',
              'stgReleaseGateEDALatestDescription',
              'stgReleaseGateEDALatestFeatureDescription',
              'stgReleaseGateEDALatestLabel',
            ],
            name: 'CustomLabel',
          },
        ],
        version: '52.0',
      },
    });
  });
});
