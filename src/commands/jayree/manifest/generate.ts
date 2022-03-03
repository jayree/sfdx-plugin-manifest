/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { flags, FlagsConfig } from '@salesforce/command';
import { FileProperties, ListMetadataQuery } from 'jsforce';
import { Messages, Connection } from '@salesforce/core';
import { RegistryAccess, ComponentSet, PackageManifestObject } from '@salesforce/source-deploy-retrieve';
import { normalizeToArray } from '@salesforce/source-deploy-retrieve/lib/src/utils';
import * as fs from 'fs-extra';
import { JayreeSfdxCommand } from '../../../jayreeSfdxCommand';

const registryAccess = new RegistryAccess();

Messages.importMessagesDirectory(__dirname);

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
export default class GeneratePackageXML extends JayreeSfdxCommand {
  public static aliases = ['jayree:packagexml'];

  public static description = messages.getMessage('commandDescription');

  public static examples = messages.getMessage('examples').split(os.EOL);

  protected static flagsConfig: FlagsConfig = {
    quickfilter: flags.array({
      char: 'q',
      description: messages.getMessage('quickfilterFlagDescription'),
    }),
    matchcase: flags.boolean({
      char: 'c',
      description: messages.getMessage('matchCaseFlagDescription'),
    }),
    matchwholeword: flags.boolean({
      char: 'w',
      description: messages.getMessage('matchWholeWordFlagDescription'),
    }),
    includeflowversions: flags.boolean({
      description: messages.getMessage('includeflowversionsDescription'),
    }),
    file: flags.string({
      char: 'f',
      description: messages.getMessage('fileFlagDescription'),
    }),
    excludemanaged: flags.boolean({
      char: 'x',
      description: messages.getMessage('excludeManagedFlagDescription'),
      exclusive: ['excludeall'],
    }),
    excludeall: flags.boolean({
      char: 'a',
      description: messages.getMessage('excludeAllFlagDescription'),
      exclusive: ['excludemanaged'],
    }),
  };

  protected static requiresUsername = true;
  protected static supportsDevhubUsername = false;
  protected static requiresProject = false;

  protected cacheConnection: Connection;

  // eslint-disable-next-line complexity
  public async run(): Promise<PackageManifestObject> {
    this.warnIfRunByAlias(GeneratePackageXML.aliases, GeneratePackageXML.id);
    await this.org.refreshAuth();

    const file = this.getFlag<string>('file');
    this.ux.startSpinner(`Generating ${file || 'package.xml'}`);
    this.cacheConnection = this.org.getConnection();

    const managed = ['beta', 'deleted', 'deprecated', 'installed', 'released'];
    const all = ['beta', 'deleted', 'deprecated', 'installed', 'released', 'installedEditable', 'deprecatedEditable'];

    const componentFilter = (component: Partial<FileProperties>): boolean =>
      !(
        (this.getFlag<boolean>('excludemanaged') &&
          ((component.namespacePrefix &&
            (managed.includes(component.manageableState) || component.manageableState === undefined)) ||
            managed.includes(component.manageableState))) ||
        (this.getFlag<boolean>('excludeall') &&
          ((component.namespacePrefix &&
            (all.includes(component.manageableState) || component.manageableState === undefined)) ||
            all.includes(component.manageableState)))
      );

    let componentSet = await ComponentSet.fromConnection({
      usernameOrConnection: this.cacheConnection,
      componentFilter,
    });

    if (this.getFlag<boolean>('includeflowversions')) {
      const flowPromises: Array<Promise<FileProperties[]>> = [];
      flowPromises.push(this.listMembers({ type: 'Flow' }, '43.0'));
      for await (const flowResult of flowPromises) {
        for (const component of flowResult.filter(componentFilter)) {
          componentSet.add({ fullName: component.fullName, type: registryAccess.getTypeByName(component.type) });
        }
      }
    }
    const quickFilter = this.getFlag<string[]>('quickfilter');
    if (quickFilter) {
      componentSet = componentSet.filter((component) => {
        let filter = quickFilter;
        const comp: { fullName: string; type: string } = { fullName: component.fullName, type: component.type.name };
        if (!this.getFlag<boolean>('matchcase')) {
          filter = quickFilter.join('~').toLowerCase().split('~');
          comp.fullName = component.fullName.toLocaleLowerCase();
          comp.type = component.type.name.toLowerCase();
        }
        if (this.getFlag<boolean>('matchwholeword')) {
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
        const flowDefinitionQuery = (await this.cacheConnection.tooling.query(
          `SELECT DeveloperName, ActiveVersion.VersionNumber, LatestVersion.VersionNumber FROM FlowDefinition where DeveloperName in (${hasFlows
            .map((component) => `'${component.fullName}'`)
            .toString()})`
        )) as QueryResult;
        const flowDefinitionRecods = flowDefinitionQuery.records as FlowDefinitionRecord[];
        for (const record of flowDefinitionRecods) {
          if (record.LatestVersion?.VersionNumber !== record.ActiveVersion?.VersionNumber) {
            this.ux.log(
              `DeveloperName: ${record.DeveloperName}, ActiveVersion: ${record.ActiveVersion?.VersionNumber}, LatestVersion: ${record.LatestVersion?.VersionNumber}`
            );
          }
        }
      } catch (error) {
        this.logger.debug((error as Error).message);
      }
    }

    componentSet = componentSet.filter((component) => component.type.name !== 'FlowDefinition');

    componentSet.apiVersion = this.cacheConnection.getApiVersion();

    if (file) {
      await fs.ensureFile(file);
      await fs.writeFile(file, componentSet.getPackageXml());
    } else {
      this.ux.log(componentSet.getPackageXml());
    }

    this.ux.stopSpinner();
    return componentSet.getObject();
  }

  protected async listMembers(query: ListMetadataQuery, apiVersion?: string): Promise<FileProperties[]> {
    let members: FileProperties[];
    try {
      if (!apiVersion) {
        apiVersion = this.cacheConnection.getApiVersion();
      }
      members = normalizeToArray(await this.cacheConnection.metadata.list(query, apiVersion));
    } catch (error) {
      members = [];
      this.logger.debug((error as Error).message);
    }
    return members;
  }
}
