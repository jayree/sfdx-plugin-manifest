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
import { setAutocrlfOnWin32 } from '../../helper/git.js';

describe('result testing with EDA #7', () => {
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

    expect(
      emitWarningStub.calledWith(
        `The file ${join('force-app', 'main', 'default', 'aura', 'autocomplete', 'autocomplete.cmp')} moved to ${join('src', 'aura', 'autocomplete', 'autocomplete.cmp')} was ignored.`,
      ),
    ).to.be.true;
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({
      Package: { types: [], version: '52.0' },
    });
  });
});
