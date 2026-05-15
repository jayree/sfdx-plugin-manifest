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
import assert from 'node:assert/strict';
import { NamedPackageDir } from '@salesforce/core';
import {
  DestructiveChangesType,
  MetadataResolver,
  RegistryAccess,
  SourceComponent,
} from '@salesforce/source-deploy-retrieve';
import { describe, it } from 'mocha';
import { getComponentSets, getGroupedFiles } from '../../../src/SDR-extra/shared/gitComponentSetArray.js';
import { VirtualTreeContainerExtra } from '../../../src/SDR-extra/resolve/treeContainersExtra.js';

const packageDirs = [
  { name: 'force-app', fullPath: '/repo/force-app', path: 'force-app', default: true },
  { name: 'pkg', fullPath: '/repo/pkg', path: 'pkg' },
] as NamedPackageDir[];

describe('getGroupedFiles', () => {
  it('groups all changes into a single non-sequential group', () => {
    const groups = getGroupedFiles({
      packageDirs,
      adds: ['force-app/main/default/classes/Added.cls'],
      modifies: ['pkg/main/default/classes/Changed.cls'],
      deletes: ['force-app/main/default/classes/Removed.cls'],
    });

    assert.deepEqual(groups, [
      {
        path: 'force-app;pkg',
        adds: ['force-app/main/default/classes/Added.cls'],
        modifies: ['pkg/main/default/classes/Changed.cls'],
        deletes: ['force-app/main/default/classes/Removed.cls'],
      },
    ]);
  });

  it('groups changes by package directory in sequential mode', () => {
    const groups = getGroupedFiles(
      {
        packageDirs,
        adds: ['force-app/main/default/classes/Added.cls', 'pkg/main/default/classes/PkgAdded.cls'],
        modifies: ['pkg/main/default/classes/Changed.cls'],
        deletes: ['force-app/main/default/classes/Removed.cls'],
      },
      true,
    );

    assert.deepEqual(groups, [
      {
        path: 'force-app',
        adds: ['force-app/main/default/classes/Added.cls'],
        modifies: [],
        deletes: ['force-app/main/default/classes/Removed.cls'],
      },
      {
        path: 'pkg',
        adds: ['pkg/main/default/classes/PkgAdded.cls'],
        modifies: ['pkg/main/default/classes/Changed.cls'],
        deletes: [],
      },
    ]);
  });

  it('filters empty package directory groups in sequential mode', () => {
    const groups = getGroupedFiles(
      {
        packageDirs,
        adds: ['pkg/main/default/classes/PkgAdded.cls'],
        modifies: [],
        deletes: [],
      },
      true,
    );

    assert.deepEqual(groups, [
      {
        path: 'pkg',
        adds: ['pkg/main/default/classes/PkgAdded.cls'],
        modifies: [],
        deletes: [],
      },
    ]);
  });

  it('returns no groups when there are no package directories', () => {
    const groups = getGroupedFiles({
      packageDirs: [],
      adds: ['force-app/main/default/classes/Added.cls'],
      modifies: ['force-app/main/default/classes/Changed.cls'],
      deletes: ['force-app/main/default/classes/Removed.cls'],
    });

    assert.deepEqual(groups, []);
  });
});

describe('getComponentSets', () => {
  const registry = new RegistryAccess();
  const apexClassType = registry.getTypeByName('apexclass');
  const workflowRuleType = registry.getTypeByName('workflowrule');
  const workflowType = registry.getTypeByName('workflow');

  const sourceComponent = (fullName: string): SourceComponent =>
    new SourceComponent({
      name: fullName,
      type: apexClassType,
    });

  const workflowRule = (fullName: string, xml: object): SourceComponent => {
    const component = new SourceComponent({
      name: fullName,
      type: workflowRuleType,
    });
    Object.assign(component, { parseXmlSync: () => xml });
    return component;
  };

  const workflow = (children: SourceComponent[], xml: object): SourceComponent => {
    const component = new SourceComponent({
      name: 'Account',
      type: workflowType,
    });
    Object.assign(component, {
      getChildren: () => children,
      parseXmlSync: () => xml,
    });
    return component;
  };

  const resolver = (
    componentsByPath: Map<string, SourceComponent[]>,
    forceIgnoredPaths = new Set<string>(),
  ): MetadataResolver =>
    ({
      forceIgnoredPaths,
      getComponentsFromPath: (filename: string) => componentsByPath.get(filename) ?? [],
    }) as unknown as MetadataResolver;

  const virtualTreeContainer = { exists: () => false } as unknown as VirtualTreeContainerExtra;

  it('adds deploy components for added and modified non-xml files', () => {
    const added = sourceComponent('Added');
    const modified = sourceComponent('Changed');
    const componentSets = getComponentSets({
      groupings: [
        {
          path: 'force-app',
          adds: ['force-app/main/default/classes/Added.cls'],
          modifies: ['force-app/main/default/classes/Changed.cls'],
          deletes: [],
        },
      ],
      sourceApiVersion: '61.0',
      registry,
      resolverForDeletes: resolver(new Map()),
      resolverForNonDeletes: resolver(
        new Map([
          ['force-app/main/default/classes/Added.cls', [added]],
          ['force-app/main/default/classes/Changed.cls', [modified]],
        ]),
      ),
      virtualTreeContainer,
    });

    assert.equal(componentSets.length, 1);
    assert.equal(componentSets[0].sourceApiVersion, '61.0');
    assert.equal(componentSets[0].size, 2);
    assert.equal(componentSets[0].has({ fullName: 'Added', type: 'ApexClass' }), true);
    assert.equal(componentSets[0].has({ fullName: 'Changed', type: 'ApexClass' }), true);
  });

  it('adds deleted components as post destructive changes', async () => {
    const deleted = sourceComponent('Removed');
    const componentSets = getComponentSets({
      groupings: [
        {
          path: 'force-app',
          adds: [],
          modifies: [],
          deletes: ['force-app/main/default/classes/Removed.cls'],
        },
      ],
      sourceApiVersion: '61.0',
      registry,
      resolverForDeletes: resolver(new Map([['force-app/main/default/classes/Removed.cls', [deleted]]])),
      resolverForNonDeletes: resolver(new Map()),
      virtualTreeContainer,
    });

    assert.equal(componentSets.length, 1);
    assert.deepEqual(componentSets[0].getTypesOfDestructiveChanges(), [DestructiveChangesType.POST]);
    assert.deepEqual(await componentSets[0].getObject(DestructiveChangesType.POST), {
      Package: {
        types: [{ members: ['Removed'], name: 'ApexClass' }],
        version: '61.0',
      },
    });
  });

  it('copies force-ignored paths from both resolvers', () => {
    const componentSets = getComponentSets({
      groupings: [
        {
          path: 'force-app',
          adds: [],
          modifies: [],
          deletes: [],
        },
      ],
      registry,
      resolverForDeletes: resolver(new Map(), new Set(['deleted.forceignored'])),
      resolverForNonDeletes: resolver(new Map(), new Set(['added.forceignored'])),
      virtualTreeContainer,
    });

    assert.equal(componentSets.length, 1);
    assert.deepEqual(componentSets[0].forceIgnoredPaths, new Set(['deleted.forceignored', 'added.forceignored']));
  });

  it('filters empty component sets with no force-ignored paths', () => {
    const componentSets = getComponentSets({
      groupings: [
        {
          path: 'force-app',
          adds: [],
          modifies: [],
          deletes: [],
        },
      ],
      registry,
      resolverForDeletes: resolver(new Map()),
      resolverForNonDeletes: resolver(new Map()),
      virtualTreeContainer,
    });

    assert.deepEqual(componentSets, []);
  });

  it('ignores modified metadata xml files when a resolver force-ignored the file', () => {
    const filename = 'force-app/main/default/classes/Ignored.cls-meta.xml';
    const ref1Component = sourceComponent('Ignored');
    const ref2Component = sourceComponent('Ignored');
    Object.assign(ref1Component, { parseXmlSync: () => ({ status: 'old' }) });
    Object.assign(ref2Component, { parseXmlSync: () => ({ status: 'new' }) });

    const componentSets = getComponentSets({
      groupings: [{ path: 'force-app', adds: [], modifies: [filename], deletes: [] }],
      registry,
      resolverForDeletes: resolver(new Map([[filename, [ref1Component]]]), new Set([filename])),
      resolverForNonDeletes: resolver(new Map([[filename, [ref2Component]]])),
      virtualTreeContainer,
    });

    assert.equal(componentSets.length, 1);
    assert.equal(componentSets[0].size, 0);
    assert.deepEqual(componentSets[0].forceIgnoredPaths, new Set([filename]));
  });

  it('ignores modified metadata xml files when parsed contents are unchanged', () => {
    const filename = 'force-app/main/default/classes/Unchanged.cls-meta.xml';
    const ref1Component = sourceComponent('Unchanged');
    const ref2Component = sourceComponent('Unchanged');
    Object.assign(ref1Component, { parseXmlSync: () => ({ apiVersion: '61.0' }) });
    Object.assign(ref2Component, { parseXmlSync: () => ({ apiVersion: '61.0' }) });

    const componentSets = getComponentSets({
      groupings: [{ path: 'force-app', adds: [], modifies: [filename], deletes: [] }],
      registry,
      resolverForDeletes: resolver(new Map([[filename, [ref1Component]]])),
      resolverForNonDeletes: resolver(new Map([[filename, [ref2Component]]])),
      virtualTreeContainer,
    });

    assert.deepEqual(componentSets, []);
  });

  it('adds the non-delete component when a metadata xml file changed for a type without children', () => {
    const filename = 'force-app/main/default/classes/Changed.cls-meta.xml';
    const ref1Component = sourceComponent('Changed');
    const ref2Component = sourceComponent('Changed');
    Object.assign(ref1Component, { parseXmlSync: () => ({ apiVersion: '60.0' }) });
    Object.assign(ref2Component, { parseXmlSync: () => ({ apiVersion: '61.0' }) });

    const componentSets = getComponentSets({
      groupings: [{ path: 'force-app', adds: [], modifies: [filename], deletes: [] }],
      registry,
      resolverForDeletes: resolver(new Map([[filename, [ref1Component]]])),
      resolverForNonDeletes: resolver(new Map([[filename, [ref2Component]]])),
      virtualTreeContainer,
    });

    assert.equal(componentSets.length, 1);
    assert.equal(componentSets[0].has({ fullName: 'Changed', type: 'ApexClass' }), true);
  });

  it('adds, deletes, and modifies child components from changed parent metadata xml', () => {
    const filename = 'force-app/main/default/workflows/Account.workflow-meta.xml';
    const removedRule = workflowRule('Account.Removed', { fullName: 'Removed', actions: [] });
    const changedRuleBefore = workflowRule('Account.Changed', { fullName: 'Changed', active: false });
    const addedRule = workflowRule('Account.Added', { fullName: 'Added', actions: [] });
    const changedRuleAfter = workflowRule('Account.Changed', { fullName: 'Changed', active: true });
    const ref1Component = workflow([removedRule, changedRuleBefore], { rules: [{ fullName: 'Changed' }] });
    const ref2Component = workflow([addedRule, changedRuleAfter], {
      rules: [{ fullName: 'Changed' }, { fullName: 'Added' }],
    });

    const componentSets = getComponentSets({
      groupings: [{ path: 'force-app', adds: [], modifies: [filename], deletes: [] }],
      registry,
      resolverForDeletes: resolver(new Map([[filename, [ref1Component]]])),
      resolverForNonDeletes: resolver(new Map([[filename, [ref2Component]]])),
      virtualTreeContainer,
    });

    assert.equal(componentSets.length, 1);
    assert.deepEqual(componentSets[0].getTypesOfDestructiveChanges(), [DestructiveChangesType.POST]);
    assert.equal(componentSets[0].has({ fullName: 'Account.Added', type: 'WorkflowRule' }), true);
    assert.equal(componentSets[0].has({ fullName: 'Account.Changed', type: 'WorkflowRule' }), true);
    assert.deepEqual(
      componentSets[0].getComponentFilenamesByNameAndType({ fullName: 'Account.Removed', type: 'WorkflowRule' }),
      [],
    );
  });
});
