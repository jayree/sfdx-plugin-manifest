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
        'target-org': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<import("@salesforce/core").Org>;
        'api-version': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string>;
        'quick-filter': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string[]>;
        'match-case': import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
        'match-whole-word': import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
        'include-flow-versions': import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
        file: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string>;
        'exclude-managed': import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
        'exclude-all': import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
    };
    private logger;
    private conn;
    run(): Promise<PackageManifestObject>;
    protected listMembers(query: ListMetadataQuery, apiVersion?: string): Promise<FileProperties[]>;
}
