/*
 * Copyright 2025, jayree
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
import sinon from 'sinon';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';
import { setAutocrlfOnWin32 } from '../../helper/git.js';

describe('result testing with NUTS', () => {
  let session: TestSession;
  let emitWarningStub: sinon.SinonStub;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/jayree/nuts-test-repo',
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

  it('should return sourceBehaviorOptions decomposed metadata w/o deletions', async () => {
    const comp = await ComponentSetExtra.fromGitDiff({
      ref: ['df2762153bd163b2fd05bca96cbf17c8bbbaeb4e'],
    });
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(
      emitWarningStub.calledWith(
        `The file ${join('force-app', 'main', 'default', 'permissionsets', 'Experience_Profile_Manager.permissionset-meta.xml')} moved to ${join('force-app', 'main', 'default', 'permissionsets', 'Experience_Profile_Manager', 'Experience_Profile_Manager.permissionset-meta.xml')} was ignored.`,
      ),
    ).to.equal(true);
    expect(
      emitWarningStub.calledWith(
        `The file ${join('force-app', 'main', 'default', 'sharingRules', 'Account.sharingRules-meta.xml')} moved to ${join('force-app', 'main', 'default', 'sharingRules', 'Account', 'Account.sharingRules-meta.xml')} was ignored.`,
      ),
    ).to.equal(true);
    expect(
      emitWarningStub.calledWith(
        `The file ${join('force-app', 'main', 'default', 'workflows', 'Case.workflow-meta.xml')} moved to ${join('force-app', 'main', 'default', 'workflows', 'Case', 'Case.workflow-meta.xml')} was ignored.`,
      ),
    ).to.equal(true);
    expect(await comp.getObject()).to.deep.equal({
      Package: {
        types: [
          {
            members: ['x1', 'x2'],
            name: 'CustomLabel',
          },
          {
            members: ['Experience_Profile_Manager'],
            name: 'PermissionSet',
          },
          {
            members: ['Account.x1'],
            name: 'SharingOwnerRule',
          },
          {
            members: ['Case.ChangePriorityToHigh'],
            name: 'WorkflowFieldUpdate',
          },
        ],
        version: '59.0',
      },
    });
  });
});
