/*
 * Copyright 2026, jayree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { join } from 'node:path';
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import fs from 'fs-extra';
import sinon from 'sinon';
import { DestructiveChangesType } from '@salesforce/source-deploy-retrieve';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';
import { setAutocrlfOnWin32 } from '../../helper/git.js';

describe('result testing with EDA #3', () => {
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

  it('should return with warning after fullname rename', async () => {
    const data = await fs.readFile(
      join(session.project.dir, 'force-app/main/default/labels/CustomLabels.labels-meta.xml'),
    );
    await fs.writeFile(
      join(session.project.dir, 'force-app/main/default/labels/CustomLabels.labels-meta.xml'),
      data.toString().replace('AfflMappingsDescription', 'AfflMappingsDescription1'),
    );
    const comp = await ComponentSetExtra.fromGitDiff(['HEAD']);
    expect(emitWarningStub.calledOnce).to.equal(true);
    expect(
      emitWarningStub.calledWith(
        `The unstaged file ${join('force-app', 'main', 'default', 'labels', 'CustomLabels.labels-meta.xml')} was processed.`,
      ),
    ).to.equal(true);
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal(['post']);
    expect(await comp.getObject(DestructiveChangesType.POST)).to.deep.equal({
      Package: { types: [{ members: ['AfflMappingsDescription'], name: 'CustomLabel' }], version: '52.0' },
    });
    expect(await comp.getObject()).to.deep.equal({
      Package: { types: [{ members: ['AfflMappingsDescription1'], name: 'CustomLabel' }], version: '52.0' },
    });
  });
});
