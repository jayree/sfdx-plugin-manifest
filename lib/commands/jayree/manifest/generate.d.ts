import { SfCommand } from '@salesforce/sf-plugins-core';
import { FileProperties, ListMetadataQuery } from '@salesforce/source-deploy-retrieve/lib/src/client/types.js';
import { PackageManifestObject } from '@salesforce/source-deploy-retrieve';
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
export default class GeneratePackageXML extends SfCommand<PackageManifestObject> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly flags: {
        'target-org': import("@oclif/core/lib/interfaces").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        'api-version': import("@oclif/core/lib/interfaces").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        'quick-filter': import("@oclif/core/lib/interfaces").OptionFlag<string[] | undefined, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        'match-case': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'match-whole-word': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'include-flow-versions': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        file: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        'exclude-managed': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'exclude-all': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    private logger;
    private conn;
    run(): Promise<PackageManifestObject>;
    protected listMembers(query: ListMetadataQuery, apiVersion?: string): Promise<FileProperties[]>;
}
