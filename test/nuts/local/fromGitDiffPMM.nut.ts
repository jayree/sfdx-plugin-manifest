/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'node:path';
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import fs from 'fs-extra';
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

  it('should return modified metadata', async () => {
    let data = await fs.readFile(
      join(session.project.dir, 'force-app/main/default/labels/CustomLabels.labels-meta.xml'),
    );
    await fs.writeFile(
      join(session.project.dir, 'force-app/main/default/labels/CustomLabels.labels-meta.xml'),
      data
        .toString()
        .replace('accordionSection_ToggleInstructionsWhenOpen', 'accordionSection_ToggleInstructionsWhenOpen1'),
    );

    data = await fs.readFile(
      join(session.project.dir, 'unpackaged/config/experience_cloud/sharingRules/Contact.sharingRules-meta.xml'),
    );
    await fs.writeFile(
      join(session.project.dir, 'unpackaged/config/experience_cloud/sharingRules/Contact.sharingRules-meta.xml'),
      data.toString().replace('Community_Volunteer', 'Community_Volunteer1'),
    );

    const comp = await ComponentSetExtra.fromGitDiff('HEAD');
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal(['post']);
    expect(await comp.getObject()).to.deep.equal({
      Package: {
        types: [
          { members: ['accordionSection_ToggleInstructionsWhenOpen1'], name: 'CustomLabel' },
          { members: ['Contact.Community_Volunteer1'], name: 'SharingOwnerRule' },
          { members: ['Contact'], name: 'SharingRules' },
        ],
        version: '49.0',
      },
    });
  });

  it('should return modified metadata - only force-app', async () => {
    const comp = await ComponentSetExtra.fromGitDiff({
      ref: ['HEAD'],
      fsPaths: ['force-app'],
    });
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal(['post']);
    expect(await comp.getObject()).to.deep.equal({
      Package: {
        types: [{ members: ['accordionSection_ToggleInstructionsWhenOpen1'], name: 'CustomLabel' }],
        version: '49.0',
      },
    });
  });

  it('should return "HEAD^1"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff('HEAD^1');
    expect(await comp.getObject()).to.have.nested.property('Package.version', '49.0');
  });
});
