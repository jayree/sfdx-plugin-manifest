/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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
