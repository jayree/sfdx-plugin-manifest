import { SfCommand } from '@salesforce/sf-plugins-core';
import { FileProperties, ListMetadataQuery } from '@salesforce/source-deploy-retrieve/lib/src/client/types.js';
import { PackageManifestObject } from '@salesforce/source-deploy-retrieve';
export type QueryResult = {
    size: number;
    totalSize: number;
    done: boolean;
    queryLocator: string;
    entityTypeName: string;
    records: StdValueSetRecord[] | FlowDefinitionRecord[];
};
export type StdValueSetRecord = {
    Id: string;
    MasterLabel: string;
    Metadata: {
        standardValue: Array<Record<string, unknown>>;
    };
};
export type FlowDefinitionRecord = {
    DeveloperName: string;
    ActiveVersion: {
        VersionNumber: string;
    };
    LatestVersion: {
        VersionNumber: string;
    };
};
export default class GeneratePackageXML extends SfCommand<PackageManifestObject> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly flags: {
        'target-org': import("@oclif/core/interfaces").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/interfaces").CustomOptions>;
        'api-version': import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        'quick-filter': import("@oclif/core/interfaces").OptionFlag<string[] | undefined, import("@oclif/core/interfaces").CustomOptions>;
        'match-case': import("@oclif/core/interfaces").BooleanFlag<boolean>;
        'match-whole-word': import("@oclif/core/interfaces").BooleanFlag<boolean>;
        'include-flow-versions': import("@oclif/core/interfaces").BooleanFlag<boolean>;
        file: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        'exclude-managed': import("@oclif/core/interfaces").BooleanFlag<boolean>;
        'exclude-all': import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    private logger;
    private conn;
    run(): Promise<PackageManifestObject>;
    protected listMembers(query: ListMetadataQuery, apiVersion?: string): Promise<FileProperties[]>;
}
