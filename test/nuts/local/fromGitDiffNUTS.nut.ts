/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';
import { ComponentSetExtra } from '../../../src/SDR-extra/index.js';
import { setAutocrlfOnWin32 } from '../../helper/git.js';

describe('result testing with NUTS', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/jayree/nuts-test-repo',
      },
      devhubAuthStrategy: 'NONE',
    });
    await setAutocrlfOnWin32(session.project.dir);
  });

  after(async () => {
    await session?.clean();
  });

  it('should return registryPresets decomposed metadata w/o deletions', async () => {
    const comp = await ComponentSetExtra.fromGitDiff({
      ref: ['b7e7ab98db9d54c2c3c5224e7de6d972f166dba7', '896a6c08146bbe963ef8aebec031175a8ddf1c6f'],
    });
    expect(comp.getTypesOfDestructiveChanges()).to.deep.equal([]);
    expect(await comp.getObject()).to.deep.equal({
      Package: {
        types: [
          { members: ['CustomLabels'], name: 'CustomLabels' },
          { members: ['Experience_Profile_Manager', 'sfdcInternalInt__sfdc_scrt2'], name: 'PermissionSet' },
          {
            members: [
              'Account',
              'ActivityRecurrence2',
              'ActivityRecurrence2Exception',
              'AlternativePaymentMethod',
              'AppointmentInvitation',
              'Asset',
              'AssistantInteraction',
              'AssistantProgress',
              'AssistantRecommendation',
              'AuthorizationForm',
              'AuthorizationFormConsent',
              'AuthorizationFormDataUse',
              'BusinessBrand',
              'BuyerGroup',
              'CalendarModel',
              'CalendarView',
              'Campaign',
              'Case',
              'ChangeRequest',
              'CleanLeadBackup',
              'CommSubscription',
              'CommSubscriptionChannelType',
              'CommSubscriptionConsent',
              'CommerceJobStatus',
              'ComponentResponseCache',
              'ConsumptionSchedule',
              'Contact',
              'ContactPointConsent',
              'ContactPointTypeConsent',
              'ContactRequest',
              'ConvCoachingRecommendation',
              'Coupon',
              'CouponCodeRedemption',
              'CreditMemo',
              'Customer',
              'DataUseLegalBasis',
              'DataUsePurpose',
              'EngagementChannelType',
              'ExchangeUserMapping',
              'ExternalEventMapping',
              'FinanceBalanceSnapshot',
              'FinanceTransaction',
              'FlowInterview',
              'FlowInterviewLog',
              'FlowOrchestrationInstance',
              'FlowOrchestrationStageInstance',
              'FlowOrchestrationStepInstance',
              'FlowOrchestrationWorkItem',
              'FlowTestResult',
              'FulfillmentOrder',
              'Image',
              'Incident',
              'Individual',
              'InventoryReservation',
              'Invoice',
              'Lead',
              'LearningItem',
              'LegalEntity',
              'ListEmail',
              'Location',
              'LocationGroup',
              'Macro',
              'MacroUsage',
              'MessagingEndUser',
              'MessagingSession',
              'NotifDeliveryUserPref',
              'OperatingHours',
              'Opportunity',
              'Order',
              'OrgDeleteRequest',
              'PartyConsent',
              'PrivacyJobSession',
              'PrivacyObjectSession',
              'PrivacyRTBFRequest',
              'PrivacySessionRecordFailure',
              'Problem',
              'ProcessException',
              'Product2',
              'ProductCatalog',
              'Promotion',
              'PromotionLineItemRule',
              'PromotionSegment',
              'PromptAction',
              'PromptError',
              'QuickText',
              'QuickTextUsage',
              'RecordMergeHistory',
              'ReportResultBlob',
              'ReturnOrder',
              'Scorecard',
              'Seller',
              'ServiceAppointment',
              'ServiceAppointmentAttendee',
              'ServiceContract',
              'ServiceResource',
              'ServiceTerritory',
              'Shift',
              'Shipment',
              'ShippingConfigurationSet',
              'SiqUserBlacklist',
              'StreamActivityAccess',
              'StreamingChannel',
              'TableauHostMapping',
              'TodayGoal',
              'User',
              'UserAppMenuCustomization',
              'UserEmailPreferredPerson',
              'UserExternalCredential',
              'UserPrioritizedRecord',
              'UserProvisioningRequest',
              'VoiceCall',
              'VoiceChnlInteractionEvent',
              'Waitlist',
              'WebCart',
              'WebStore',
              'WorkOrder',
              'WorkPlan',
              'WorkPlanTemplate',
              'WorkStepTemplate',
              'WorkType',
              'WorkTypeGroup',
            ],
            name: 'SharingRules',
          },
          { members: ['Case'], name: 'Workflow' },
          { members: ['Case.ChangePriorityToHigh'], name: 'WorkflowFieldUpdate' },
        ],
        version: '59.0',
      },
    });
  });
});
