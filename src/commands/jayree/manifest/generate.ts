/*
 * Copyright (c) 2022, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SfCommand,
  Flags,
  arrayWithDeprecation,
  orgApiVersionFlagWithDeprecations,
  requiredOrgFlagWithDeprecations,
  Ux,
} from '@salesforce/sf-plugins-core';
import { FileProperties, ListMetadataQuery } from '@salesforce/source-deploy-retrieve/lib/src/client/types.js';
import { Messages, Logger, Connection } from '@salesforce/core';
import { RegistryAccess, ComponentSet, PackageManifestObject } from '@salesforce/source-deploy-retrieve';
import { ensureArray } from '@salesforce/kit';
import fs from 'fs-extra';

// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(__filename);

Messages.importMessagesDirectory(__dirname);

const registryAccess = new RegistryAccess();

const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'manifestgenerate');

export interface QueryResult {
  size: number;
  totalSize: number;
  done: boolean;
  queryLocator: string;
  entityTypeName: string;
  records: StdValueSetRecord[] | FlowDefinitionRecord[];
}

export interface StdValueSetRecord {
  Id: string;
  MasterLabel: string;
  Metadata: { standardValue: Array<Record<string, unknown>> };
}

export interface FlowDefinitionRecord {
  DeveloperName: string;
  ActiveVersion: { VersionNumber: string };
  LatestVersion: { VersionNumber: string };
}
export default class GeneratePackageXML extends SfCommand<PackageManifestObject> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');

  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    'quick-filter': arrayWithDeprecation({
      char: 'q',
      description: messages.getMessage('flags.quick-filter.summary'),
      deprecateAliases: true,
      aliases: ['quickfilter'],
    }),
    'match-case': Flags.boolean({
      char: 'c',
      summary: messages.getMessage('flags.match-case.summary'),
      deprecateAliases: true,
      aliases: ['matchcase'],
    }),
    'match-whole-word': Flags.boolean({
      char: 'w',
      summary: messages.getMessage('flags.match-whole-word.summary'),
      deprecateAliases: true,
      aliases: ['matchwholeword'],
    }),
    'include-flow-versions': Flags.boolean({
      summary: messages.getMessage('flags.include-flow-versions.summary'),
      deprecateAliases: true,
      aliases: ['includeflowversions'],
    }),
    file: Flags.string({
      char: 'f',
      summary: messages.getMessage('flags.file.summary'),
    }),
    'exclude-managed': Flags.boolean({
      summary: messages.getMessage('flags.exclude-managed.summary'),
      exclusive: ['exclude-all'],
      deprecateAliases: true,
      aliases: ['excludemanaged', 'x'],
    }),
    'exclude-all': Flags.boolean({
      summary: messages.getMessage('flags.exclude-all.summary'),
      exclusive: ['exclude-managed'],
      deprecateAliases: true,
      aliases: ['excludeall', 'a'],
    }),
  };

  private logger!: Logger;
  private conn: Connection;

  public async run(): Promise<PackageManifestObject> {
    this.logger = await Logger.child('jayree:manifest:generate');
    const { flags } = await this.parse(GeneratePackageXML);

    this.conn = flags['target-org'].getConnection(flags['api-version']);
    const ux = new Ux({ jsonEnabled: this.jsonEnabled() });

    const file = flags['file'];
    ux.spinner.start(`Generating ${file || 'package.xml'}`);

    const managed = ['beta', 'deleted', 'deprecated', 'installed', 'released'];
    const all = ['beta', 'deleted', 'deprecated', 'installed', 'released', 'installedEditable', 'deprecatedEditable'];

    const componentFilter = (component: Partial<FileProperties>): boolean =>
      !(
        (flags['exclude-managed'] &&
          ((component.namespacePrefix &&
            (managed.includes(component.manageableState) || component.manageableState === undefined)) ||
            managed.includes(component.manageableState))) ||
        (flags['exclude-all'] &&
          ((component.namespacePrefix &&
            (all.includes(component.manageableState) || component.manageableState === undefined)) ||
            all.includes(component.manageableState)))
      );

    let componentSet = await ComponentSet.fromConnection({
      usernameOrConnection: this.conn,
      componentFilter,
    });

    if (flags['include-flow-versions']) {
      const flowResult = await this.listMembers({ type: 'Flow' }, '43.0');
      for (const component of flowResult.filter(componentFilter)) {
        componentSet.add({ fullName: component.fullName, type: registryAccess.getTypeByName(component.type) });
      }
    }
    const quickFilter = flags['quick-filter'];
    if (quickFilter) {
      componentSet = componentSet.filter((component) => {
        let filter = quickFilter;
        const comp: { fullName: string; type: string } = { fullName: component.fullName, type: component.type.name };
        if (!flags['match-case']) {
          filter = quickFilter.join('~').toLowerCase().split('~');
          comp.fullName = component.fullName.toLocaleLowerCase();
          comp.type = component.type.name.toLowerCase();
        }
        if (flags['match-whole-word']) {
          return filter.includes(comp.fullName) || filter.includes(comp.type);
        } else {
          for (const f of filter) {
            return comp.fullName.includes(f) || comp.type.includes(f);
          }
        }
      });
    }

    const hasFlows = componentSet.toArray().filter((component) => component.type.name === 'Flow');

    if (hasFlows.length) {
      try {
        const flowDefinitionQuery = (await this.conn.tooling.query(
          `SELECT DeveloperName, ActiveVersion.VersionNumber, LatestVersion.VersionNumber FROM FlowDefinition where DeveloperName in (${hasFlows
            .map((component) => `'${component.fullName}'`)
            .toString()})`
        )) as QueryResult;
        const flowDefinitionRecods = flowDefinitionQuery.records as FlowDefinitionRecord[];
        for (const record of flowDefinitionRecods) {
          if (record.LatestVersion?.VersionNumber !== record.ActiveVersion?.VersionNumber) {
            this.log(
              `DeveloperName: ${record.DeveloperName}, ActiveVersion: ${record.ActiveVersion?.VersionNumber}, LatestVersion: ${record.LatestVersion?.VersionNumber}`
            );
          }
        }
      } catch (error) {
        this.logger.debug((error as Error).message);
      }
    }

    componentSet = componentSet.filter((component) => component.type.name !== 'FlowDefinition');

    componentSet.apiVersion = this.conn.getApiVersion();

    if (file) {
      await fs.ensureFile(file);
      await fs.writeFile(file, await componentSet.getPackageXml());
    } else {
      this.log(await componentSet.getPackageXml());
    }

    ux.spinner.stop();
    return componentSet.getObject();
  }

  protected async listMembers(query: ListMetadataQuery, apiVersion?: string): Promise<FileProperties[]> {
    let members: FileProperties[];
    try {
      if (!apiVersion) {
        apiVersion = this.conn.getApiVersion();
      }
      members = ensureArray((await this.conn.metadata.list(query, apiVersion)) as FileProperties[]);
    } catch (error) {
      members = [];
      this.logger.debug((error as Error).message);
    }
    return members;
  }
}
