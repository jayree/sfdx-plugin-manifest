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
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';
import { setAutocrlfOnWin32 } from '../../helper/git.js';

describe('result testing with EDA #6', () => {
  let session: TestSession;
  let emitWarningStub: sinon.SinonStub;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/SalesforceFoundation/EDA',
      },
      devhubAuthStrategy: 'NONE',
    });
    emitWarningStub = sinon.stub(process, 'emitWarning');
    await setAutocrlfOnWin32(session.project.dir);
  });

  after(async () => {
    await session?.clean();
    emitWarningStub.restore();
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
    expect(emitWarningStub.calledTwice).to.equal(true);
    expect(
      emitWarningStub.calledWith(
        `The unstaged file ${join('force-app', 'main', 'default', 'objects', 'Account', 'fields', 'Billing_County__c.field-meta.xml')} was processed.`,
      ),
    ).to.equal(true);
    expect(
      emitWarningStub.calledWith(
        `The forceignored file ${join('force-app', 'main', 'default', 'objects', 'Account', 'fields', 'Billing_County__c.field-meta.xml')} was ignored.`,
      ),
    ).to.equal(true);
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({ Package: { types: [], version: '52.0' } });
  });
});
