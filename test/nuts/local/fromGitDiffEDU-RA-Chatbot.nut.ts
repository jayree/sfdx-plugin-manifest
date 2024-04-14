/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { join } from 'node:path';
import fs from 'fs-extra';
import { spyMethod } from '@salesforce/ts-sinon';
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { Lifecycle } from '@salesforce/core';
import { TestContext } from '@salesforce/core/testSetup';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';

describe('result testing with EDU-RA-Chatbot', () => {
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
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify([]));
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            { members: ['Mascot'], name: 'Bot' },
            { members: ['Mascot.v1'], name: 'BotVersion' },
          ],
          version: '50.0',
        },
      }),
    );
  });

  it('should return "updated dialog" with warning after local file removal', async () => {
    const sandbox = new TestContext().SANDBOX;
    const lifecycle = Lifecycle.getInstance();
    const spy = spyMethod(sandbox, lifecycle, 'emitWarning');

    await fs.remove(join(session.project.dir, 'force-app/main/default/bots/Mascot/v1.botVersion-meta.xml'));
    const comp = await ComponentSetExtra.fromGitDiff([
      'c0e0918a5e3effb1d2774759d4798618b83251a2',
      'd68f23aa8c39e61e861454ade8f88b0715df2409',
    ]);
    expect(spy.calledOnce).to.be.true;
    expect(spy.calledWith(`The component "BotVersion:Mascot.v1" was not found locally.`)).to.be.true;
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify([]));
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: {
          types: [{ members: ['Mascot'], name: 'Bot' }],
          version: '50.0',
        },
      }),
    );
  });
});
