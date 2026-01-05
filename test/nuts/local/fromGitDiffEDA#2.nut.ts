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
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { DestructiveChangesType } from '@salesforce/source-deploy-retrieve';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';
import { setAutocrlfOnWin32 } from '../../helper/git.js';

describe('result testing with EDA #2', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/SalesforceFoundation/EDA',
      },
      devhubAuthStrategy: 'NONE',
    });
    await setAutocrlfOnWin32(session.project.dir);
  });

  after(async () => {
    await session?.clean();
  });

  it('should return "make release gate label generic"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff({
      ref: ['aa15a67b689e6d0cfb3ebe10c2b0ff241417559c', '0e3182433fae05158c873b57e2fe0c7eaef5d86f'],
      fsPaths: ['force-app'],
    });
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal(['post']);
    expect(await comp.getObject(DestructiveChangesType.POST)).to.deep.equal({
      Package: {
        types: [
          {
            members: ['stgReleaseGateEDASpring22FeatureHelpLabel', 'stgReleaseGateEDAWinter22FeatureHelpLabel'],
            name: 'CustomLabel',
          },
        ],
        version: '52.0',
      },
    });
    expect(await comp.getObject()).to.deep.equal({
      Package: {
        types: [
          { members: ['EDASpring22ReleaseGate', 'EDAWinter22ReleaseGate'], name: 'ApexClass' },
          { members: ['stgReleaseGateEDAFeatureHelpLabel'], name: 'CustomLabel' },
          { members: ['ca', 'de', 'en_GB', 'es', 'es_MX', 'fi', 'fr', 'ja', 'nl_NL'], name: 'Translations' },
        ],
        version: '52.0',
      },
    });
  });
});
