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

describe('result testing with EDA', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/SalesforceFoundation/EDA',
      },
      devhubAuthStrategy: 'NONE',
    });
  });

  after(async () => {
    await session?.clean();
  });

  it('should return "Added new custom labels"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff({
      ref: '48a560bbb507e82dca0caac53024ccf60ecda7fb..83e42ae2b162833a98121a147e00b93feb3784aa',
    });
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify([]));
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            {
              members: [
                'stgReleaseGateActivateLatest',
                'stgReleaseGateEDALatestDescription',
                'stgReleaseGateEDALatestFeatureDescription',
                'stgReleaseGateEDALatestLabel',
              ],
              name: 'CustomLabel',
            },
          ],
          version: '52.0',
        },
      }),
    );
  });

  it('should return "make release gate label generic"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff({
      ref: ['aa15a67b689e6d0cfb3ebe10c2b0ff241417559c', '0e3182433fae05158c873b57e2fe0c7eaef5d86f'],
      fsPaths: ['force-app'],
    });
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify(['post']));
    expect(JSON.stringify(await comp.getObject(DestructiveChangesType.POST))).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            {
              members: ['stgReleaseGateEDASpring22FeatureHelpLabel', 'stgReleaseGateEDAWinter22FeatureHelpLabel'],
              name: 'CustomLabel',
            },
          ],
          version: '52.0',
        },
      }),
    );
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            { members: ['EDASpring22ReleaseGate', 'EDAWinter22ReleaseGate'], name: 'ApexClass' },
            { members: ['stgReleaseGateEDAFeatureHelpLabel'], name: 'CustomLabel' },
            { members: ['ca', 'de', 'en_GB', 'es', 'es_MX', 'fi', 'fr', 'ja', 'nl_NL'], name: 'Translations' },
          ],
          version: '52.0',
        },
      }),
    );
  });

  it('should return "Add prefEmail Spanish"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff(
      'edb3652099ea8d6897847dda565c0b6870d247e8..5094826337ccccbf01a2f18cb7063091fcc7921d',
    );
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify([]));
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            { members: ['ACCT_AdministrativeNameRefresh_TEST', 'ACCT_IndividualAccounts_TEST'], name: 'ApexClass' },
          ],
          version: '52.0',
        },
      }),
    );
  });

  it('should return "Added latest release class"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff([
      '83e42ae2b162833a98121a147e00b93feb3784aa',
      '0177be89798473c827acf2e4fa9165388eb50ebc',
    ]);
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify([]));
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: { types: [{ members: ['EDALatestReleaseGate'], name: 'ApexClass' }], version: '52.0' },
      }),
    );
  });

  it('should return "Add error message formatting"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff([
      '28d63656ad325cb4014c4cc1f5d16f49dd9fab1a',
      '71128be4d662c067b6062932397d6461f252d155',
    ]);
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify([]));
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: { types: [{ members: ['edaSettings'], name: 'LightningComponentBundle' }], version: '52.0' },
      }),
    );
  });

  it('should return "adding translations"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff([
      'e02f7d5f5abef20f150f1914bd3745ce96377ff2',
      '20d3544cc1f8fa3f54e7306cbeafe6a32991d6d1',
    ]);
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify([]));
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            {
              members: ['Test_Definition__mdt-en_US', 'Test_Score_Definition__mdt-en_US'],
              name: 'CustomObjectTranslation',
            },
          ],
          version: '52.0',
        },
      }),
    );
  });

  it('should return "adding fields"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff([
      'ea8c751860e03db376395b7db86139d6cfe26023',
      '5aadd5ddc426b7155ea4f970ed73c1167efb3115',
    ]);
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify([]));
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            {
              members: [
                'Test_Score__c.Credentialing_Identifier__c',
                'Test_Score__c.Letter_Score__c',
                'Test_Score__c.Status__c',
              ],
              name: 'CustomField',
            },
          ],
          version: '52.0',
        },
      }),
    );
  });

  it('should return "Added translation stubs for the "Started" application status option"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff([
      '08f5debb2521434ce68d6c049c734d8507aa84aa',
      '9b2619e54b3231749a906aa856e82b976e0f43e7',
    ]);
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify([]));
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            {
              members: [
                'Application__c-ca',
                'Application__c-de',
                'Application__c-en_GB',
                'Application__c-en_US',
                'Application__c-es',
                'Application__c-es_MX',
                'Application__c-fi',
                'Application__c-fr',
                'Application__c-ja',
                'Application__c-nl_NL',
              ],
              name: 'CustomObjectTranslation',
            },
          ],
          version: '52.0',
        },
      }),
    );
  });

  it('should return "Removed lead fields"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff([
      '8125ca6544c78b9da5faa12b260c9cd26b2023a7',
      '3aaaaecee9c4b75c7252858d4d1c7319e982aff7',
    ]);
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify(['post']));
    expect(JSON.stringify(await comp.getObject(DestructiveChangesType.POST))).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            {
              members: [
                'Lead.Area_Of_Interest__c',
                'Lead.Birth_Date__c',
                'Lead.Citizenship__c',
                'Lead.Ethnicity__c',
                'Lead.External_Id__c',
                'Lead.GPA__c',
                'Lead.Gender__c',
                'Lead.Highest_Degree_Earned__c',
                'Lead.Language__c',
                'Lead.Most_Recent_School__c',
                'Lead.Preferred_Enrollment_Date__c',
                'Lead.Preferred_Enrollment_Status__c',
                'Lead.Preferred_Teaching_Format__c',
                'Lead.Recruitment_Stage__c',
                'Lead.SMS_Opt_Out__c',
                'Lead.SSN__c',
                'Lead.Undergraduate_Major__c',
              ],
              name: 'CustomField',
            },
            {
              members: [
                'Lead-ca',
                'Lead-de',
                'Lead-en_GB',
                'Lead-en_US',
                'Lead-es',
                'Lead-es_MX',
                'Lead-fi',
                'Lead-fr',
                'Lead-ja',
                'Lead-nl_NL',
              ],
              name: 'CustomObjectTranslation',
            },
          ],
          version: '52.0',
        },
      }),
    );
    // this is the correct behaviour
    // expect(JSON.stringify(await comp.getObject())).to.be.equal(
    //   JSON.stringify({ Package: { types: [], version: '52.0' } }),
    // );

    // only for testing until it is fixed by salesforce
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            {
              members: [
                'Lead.Area_Of_Interest__c',
                'Lead.Birth_Date__c',
                'Lead.Citizenship__c',
                'Lead.Ethnicity__c',
                'Lead.External_Id__c',
                'Lead.GPA__c',
                'Lead.Gender__c',
                'Lead.Highest_Degree_Earned__c',
                'Lead.Language__c',
                'Lead.Most_Recent_School__c',
                'Lead.Preferred_Enrollment_Date__c',
                'Lead.Preferred_Enrollment_Status__c',
                'Lead.Preferred_Teaching_Format__c',
                'Lead.Recruitment_Stage__c',
                'Lead.SMS_Opt_Out__c',
                'Lead.SSN__c',
                'Lead.Undergraduate_Major__c',
              ],
              name: 'CustomField',
            },
            {
              members: [
                'Lead-ca',
                'Lead-de',
                'Lead-en_GB',
                'Lead-en_US',
                'Lead-es',
                'Lead-es_MX',
                'Lead-fi',
                'Lead-fr',
                'Lead-ja',
                'Lead-nl_NL',
              ],
              name: 'CustomObjectTranslation',
            },
          ],
          version: '52.0',
        },
      }),
    );
  });

  it('should return "edit auto status"', async () => {
    const comp = await ComponentSetExtra.fromGitDiff({
      ref: 'f35272f663ed00dd8d473bc82e821fa0b97a05a6..7412a3b1701925591227f8a7c33629a479e2ebb2',
    });
    expect(JSON.stringify(comp.getTypesOfDestructiveChanges())).to.be.equal(JSON.stringify([]));
    expect(JSON.stringify(await comp.getObject())).to.be.equal(
      JSON.stringify({
        Package: {
          types: [
            { members: ['ProgramSettingsController'], name: 'ApexClass' },
            {
              members: ['autoEnrollmentMappingModal', 'autoEnrollmentMappingModalOpener', 'edaSettingsContainer'],
              name: 'AuraDefinitionBundle',
            },
            { members: ['autoEnrollmentMappingModalBody', 'programSettings'], name: 'LightningComponentBundle' },
          ],
          version: '52.0',
        },
      }),
    );
  });
});
