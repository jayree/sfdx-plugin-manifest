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
import sinon from 'sinon';
import git from 'isomorphic-git';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';

describe('failure result testing with EDA #5', () => {
  let session: TestSession;
  let emitWarningStub: sinon.SinonStub;

  beforeEach(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/SalesforceFoundation/EDA',
      },
      devhubAuthStrategy: 'NONE',
    });
    emitWarningStub = sinon.stub(process, 'emitWarning');
  });

  afterEach(async () => {
    await session?.clean();
    emitWarningStub.restore();
  });

  it('should return with warnings if included in forceignore', async () => {
    await fs.appendFile(
      join(session.project.dir, 'force-app/main/default/classes/AccountAutoDeletionSettingsVMapper.cls'),
      '\n',
    );
    await fs.appendFile(
      join(session.project.dir, '.forceignore'),
      '\nforce-app/main/default/classes/AccountAutoDeletionSettingsVMapper.*\n',
    );
    const comp = await ComponentSetExtra.fromGitDiff(['HEAD']);
    expect(emitWarningStub.calledTwice).to.be.true;
    expect(
      emitWarningStub.calledWith(
        `The unstaged file "${session.project.dir}/force-app/main/default/classes/AccountAutoDeletionSettingsVMapper.cls" was processed.`,
      ),
    ).to.be.true;
    expect(
      emitWarningStub.calledWith(
        `The forceignored file "${session.project.dir}/force-app/main/default/classes/AccountAutoDeletionSettingsVMapper.cls" was ignored.`,
      ),
    ).to.be.true;
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({ Package: { types: [], version: '52.0' } });
  });

  it('should return with warnings if included in forceignored child', async () => {
    const data = await fs.readFile(
      join(session.project.dir, 'force-app/main/default/objects/Account/fields/Billing_County__c.field-meta.xml'),
    );
    await fs.writeFile(
      join(session.project.dir, 'force-app/main/default/objects/Account/fields/Billing_County__c.field-meta.xml'),
      data.toString().replace('false', 'true'),
    );
    await fs.appendFile(
      join(session.project.dir, '.forceignore'),
      '\nforce-app/main/default/objects/Account/fields/Billing_County__c.field-meta.xml\n',
    );
    const comp = await ComponentSetExtra.fromGitDiff(['HEAD']);
    expect(emitWarningStub.calledTwice).to.be.true;
    expect(
      emitWarningStub.calledWith(
        `The unstaged file "${session.project.dir}/force-app/main/default/objects/Account/fields/Billing_County__c.field-meta.xml" was processed.`,
      ),
    ).to.be.true;
    expect(
      emitWarningStub.calledWith(
        `The forceignored file "${session.project.dir}/force-app/main/default/objects/Account/fields/Billing_County__c.field-meta.xml" was ignored.`,
      ),
    ).to.be.true;
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({ Package: { types: [], version: '52.0' } });
  });

  it('should return with warning after move of metadata', async () => {
    await fs.writeJSON(join(session.project.dir, 'sfdx-project.json'), {
      packageDirectories: [
        {
          path: 'force-app',
          default: true,
        },
        {
          path: 'src',
        },
      ],
      namespace: 'hed',
      sourceApiVersion: '52.0',
    });
    await fs.move(
      join(session.project.dir, 'force-app/main/default/aura/autocomplete'),
      join(session.project.dir, 'src/aura/autocomplete'),
    );
    await git.add({
      fs,
      dir: session.project.dir,
      filepath: '.',
    });
    const comp = await ComponentSetExtra.fromGitDiff(['HEAD']);
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);

    expect(await comp.getObject()).to.deep.equal({
      Package: { types: [{ members: ['autocomplete'], name: 'AuraDefinitionBundle' }], version: '52.0' },
    });
  });
});
