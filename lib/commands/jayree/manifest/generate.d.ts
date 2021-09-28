import { FlagsConfig } from '@salesforce/command';
import { FileProperties, ListMetadataQuery } from 'jsforce';
import { Connection } from '@salesforce/core';
import { PackageManifestObject } from '@salesforce/source-deploy-retrieve';
import { JayreeSfdxCommand } from '../../../jayreeSfdxCommand';
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
    Metadata: {
        standardValue: Array<Record<string, unknown>>;
    };
}
export interface FlowDefinitionRecord {
    DeveloperName: string;
    ActiveVersion: {
        VersionNumber: string;
    };
    LatestVersion: {
        VersionNumber: string;
    };
}
export default class GeneratePackageXML extends JayreeSfdxCommand {
    static aliases: string[];
    static description: string;
    static examples: string[];
    protected static flagsConfig: FlagsConfig;
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    protected cacheConnection: Connection;
    run(): Promise<PackageManifestObject>;
    protected listMembers(query: ListMetadataQuery, apiVersion?: string): Promise<FileProperties[]>;
}
