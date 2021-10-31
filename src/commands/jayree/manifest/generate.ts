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
import {
  RegistryAccess,
  registry,
  ComponentSet,
  PackageManifestObject,
  MetadataType,
} from '@salesforce/source-deploy-retrieve';
import { normalizeToArray, deepFreeze } from '@salesforce/source-deploy-retrieve/lib/src/utils';
import * as fs from 'fs-extra';
import * as standardValueSetData from '../../../metadata/standardvalueset.json';
import { JayreeSfdxCommand } from '../../../jayreeSfdxCommand';

const stdValueSets = deepFreeze(standardValueSetData);
const registryAccess = new RegistryAccess();

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('@jayree/sfdx-plugin-manifest', 'manifestgenerate');

type FilePropertiesLike = {
  fullName: string;
  type: string;
  namespacePrefix?: string;
  manageableState?: string;
};

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
    let Aggregator: FilePropertiesLike[] = [];

    const componentPromises: Array<Promise<FileProperties[]>> = [];
    for (const type of Object.values(registry.types)) {
      componentPromises.push(this.listMembers({ type: type.name }));
    }

    const childrenPromises: Array<Promise<FileProperties[]>> = [];
    const componentTypes: Set<MetadataType> = new Set();

    for await (const componentResult of componentPromises) {
      Aggregator.push(...componentResult);
      for (const component of componentResult) {
        const componentType = registryAccess.getTypeByName(component.type.toLowerCase());
        componentTypes.add(componentType);
        const folderContentType = componentType.folderContentType;
        if (folderContentType) {
          childrenPromises.push(
            this.listMembers({
              type: registryAccess.getTypeByName(componentType.folderContentType).name,
              folder: component.fullName,
            })
          );
        }
      }
    }

    for (const componentType of componentTypes) {
      const childTypes = componentType.children?.types;
      if (childTypes) {
        Object.values(childTypes).map((childType) => {
          childrenPromises.push(this.listMembers({ type: childType.name }));
        });
      }
    }

    for await (const childrenResult of childrenPromises) {
      Aggregator.push(...childrenResult);
    }

    if (this.getFlag<boolean>('excludemanaged')) {
      Aggregator = Aggregator.filter(
        (component) =>
          !(
            (component.namespacePrefix && component.manageableState !== 'unmanaged') ||
            component.manageableState === 'installed'
          )
      );
    }

    if (this.getFlag<boolean>('includeflowversions')) {
      const flowPromises: Array<Promise<FileProperties[]>> = [];
      flowPromises.push(this.listMembers({ type: 'Flow' }, '43.0'));
      for await (const flowResult of flowPromises) {
        for (const component of flowResult) {
          Aggregator.push(component);
        }
      }
    }
    const quickFilter = this.getFlag<string[]>('quickfilter');
    if (quickFilter) {
      Aggregator = Aggregator.filter((component) => {
        let filter = quickFilter;
        let comp = component;
        if (!this.getFlag<boolean>('matchcase')) {
          filter = quickFilter.join('~').toLowerCase().split('~');
          comp = Object.fromEntries(
            Object.entries(component).map(([k, v]) => [k, v?.toLowerCase()])
          ) as FilePropertiesLike;
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

    const hasFlows = Aggregator.filter((component) => component.type === 'Flow');

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
              `Developername: ${record.DeveloperName}, ActiveVersion: ${record.ActiveVersion?.VersionNumber}, LatestVersion: ${record.LatestVersion?.VersionNumber}`
            );
          }
        }
      } catch (error) {
        this.logger.debug((error as Error).message);
      }
    }

    Aggregator = Aggregator.filter((component) => component.type !== 'FlowDefinition');

    const MetadataComponentAggregator = Aggregator.map((component) => {
      return { fullName: component.fullName, type: registryAccess.getTypeByName(component.type) };
    }).sort((a, b) => {
      if (a.type.name === b.type.name) {
        return a.fullName.toLowerCase() > b.fullName.toLowerCase() ? 1 : -1;
      }
      return a.type.name.toLowerCase() > b.type.name.toLowerCase() ? 1 : -1;
    });

    const pkg = new ComponentSet(MetadataComponentAggregator, registryAccess);
    pkg.apiVersion = this.cacheConnection.getApiVersion();

    if (file) {
      await fs.ensureFile(file);
      await fs.writeFile(file, pkg.getPackageXml());
    } else {
      this.ux.log(pkg.getPackageXml());
    }

    this.ux.stopSpinner();
    return pkg.getObject();
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

    if (query.type === registry.types.standardvalueset.name && members.length === 0) {
      const standardValueSetPromises = stdValueSets.fullNames.map(async (standardValueSetFullName) => {
        try {
          const standardValueSetRecord: StdValueSetRecord = await this.cacheConnection.singleRecordQuery(
            `SELECT Id, MasterLabel, Metadata FROM StandardValueSet WHERE MasterLabel = '${standardValueSetFullName}'`,
            { tooling: true }
          );
          return (
            standardValueSetRecord.Metadata.standardValue.length && {
              fullName: standardValueSetRecord.MasterLabel,
              fileName: `${registry.types.standardvalueset.directoryName}/${standardValueSetRecord.MasterLabel}.${registry.types.standardvalueset.suffix}`,
              type: registry.types.standardvalueset.name,
              createdById: '',
              createdByName: '',
              createdDate: '',
              id: '',
              lastModifiedById: '',
              lastModifiedByName: '',
              lastModifiedDate: '',
            }
          );
        } catch (error) {
          this.logger.debug((error as Error).message);
        }
      });
      for await (const standardValueSetResult of standardValueSetPromises) {
        if (standardValueSetResult) {
          members.push(standardValueSetResult);
        }
      }
    }

    return members;
  }
}
