/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';
import { setAutocrlfOnWin32 } from '../../helper/git.js';

describe('result testing with PMM', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/SalesforceFoundation/PMM',
      },
      devhubAuthStrategy: 'NONE',
    });
    await setAutocrlfOnWin32(session.project.dir);
  });

  after(async () => {
    await session?.clean();
  });

  it('should return "Label adjustments"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff([
      '7acc58b91e92e87eb633fb4818132adaa747b487',
      'cd478b102c572be293e0ee3e29a4b724ba692b32',
    ]);
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({
      Package: {
        types: [
          { members: ['SelectParticipantModel'], name: 'ApexClass' },
          { members: ['Filter_by_Record'], name: 'CustomLabel' },
          { members: ['participantSelector'], name: 'LightningComponentBundle' },
        ],
        version: '49.0',
      },
    });
  });

  it('should return "Label adjustments" (merge base)', async () => {
    const comp = await ComponentSetExtra.fromGitDiff(
      '7acc58b91e92e87eb633fb4818132adaa747b487...cd478b102c572be293e0ee3e29a4b724ba692b32',
    );
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({
      Package: {
        types: [
          { members: ['SelectParticipantModel'], name: 'ApexClass' },
          { members: ['Filter_by_Record'], name: 'CustomLabel' },
          { members: ['participantSelector'], name: 'LightningComponentBundle' },
        ],
        version: '49.0',
      },
    });
  });

  it('should return "HEAD~5"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff('HEAD~5');
    expect(await comp.getObject()).to.have.nested.property('Package.version', '49.0');
  });

  it('should return "HEAD^1"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff('HEAD^1');
    expect(await comp.getObject()).to.have.nested.property('Package.version', '49.0');
  });
});
