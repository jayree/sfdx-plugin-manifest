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
import { DestructiveChangesType } from '@salesforce/source-deploy-retrieve';
import sinon from 'sinon';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';
import { setAutocrlfOnWin32 } from '../../helper/git.js';

describe('failure result testing with EDU-RA-Chatbot #2', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/SalesforceFoundation/EDU-RA-Chatbot',
      },
      devhubAuthStrategy: 'NONE',
    });
    await setAutocrlfOnWin32(session.project.dir);
  });

  after(async () => {
    await session?.clean();
  });

  let emitWarningStub: sinon.SinonStub;

  beforeEach(function () {
    emitWarningStub = sinon.stub(process, 'emitWarning');
  });

  afterEach(function () {
    emitWarningStub.restore();
  });

  it('should return with warning after local file appending', async () => {
    await fs.appendFile(join(session.project.dir, 'force-app/main/default/bots/Mascot/v1.botVersion-meta.xml'), '\n');
    const comp = await ComponentSetExtra.fromGitDiff(['HEAD']);
    expect(emitWarningStub.calledOnce).to.be.true;
    expect(
      emitWarningStub.calledWith(
        `The unstaged file ${join('force-app', 'main', 'default', 'bots', 'Mascot', 'v1.botVersion-meta.xml')} was processed.`,
      ),
    ).to.be.true;
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({ Package: { types: [], version: '50.0' } });
  });

  it('should return with warning after local file removal', async () => {
    await fs.remove(join(session.project.dir, 'force-app/main/default/bots/Mascot/v1.botVersion-meta.xml'));
    const comp = await ComponentSetExtra.fromGitDiff(['HEAD']);
    expect(emitWarningStub.calledOnce).to.be.true;
    expect(
      emitWarningStub.calledWith(
        `The unstaged file ${join('force-app', 'main', 'default', 'bots', 'Mascot', 'v1.botVersion-meta.xml')} was processed.`,
      ),
    ).to.be.true;
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal(['post']);
    expect(await comp.getObject(DestructiveChangesType.POST)).to.deep.equal({
      Package: { types: [{ members: ['Mascot.v1'], name: 'BotVersion' }], version: '50.0' },
    });
    expect(await comp.getObject()).to.deep.equal({ Package: { types: [], version: '50.0' } });
  });

  it('should return "updated dialog" with warning after local file removal', async () => {
    await fs.remove(join(session.project.dir, 'force-app/main/default/bots/Mascot/v1.botVersion-meta.xml'));
    const comp = await ComponentSetExtra.fromGitDiff([
      'c0e0918a5e3effb1d2774759d4798618b83251a2',
      'd68f23aa8c39e61e861454ade8f88b0715df2409',
    ]);
    expect(emitWarningStub.calledOnce).to.be.true;
    expect(emitWarningStub.calledWith(`The component "BotVersion:Mascot.v1" was not found locally.`)).to.be.true;
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({
      Package: {
        types: [{ members: ['Mascot'], name: 'Bot' }],
        version: '50.0',
      },
    });
  });
});
