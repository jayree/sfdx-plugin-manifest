import { ArgInput } from '@oclif/core/lib/interfaces';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Optional } from '@salesforce/ts-types';
export interface GitDiffCommandResult {
    manifest?: {
        path: string;
        name: string;
    };
    destructiveChanges?: {
        path: string;
        name: string;
    };
}
export default class GitDiffCommand extends SfCommand<GitDiffCommandResult> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly args: ArgInput;
    static readonly requiresProject = true;
    static readonly flags: {
        'api-version': import("@oclif/core/lib/interfaces").OptionFlag<string>;
        'source-dir': import("@oclif/core/lib/interfaces").OptionFlag<string[]>;
        'output-dir': import("@oclif/core/lib/interfaces").OptionFlag<string>;
        'destructive-changes-only': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    private outputDir;
    private manifestName;
    private destructiveChangesName;
    private outputPath;
    private componentSet;
    private destructiveChangesOnly;
    run(): Promise<GitDiffCommandResult>;
    protected getSourceApiVersion(): Promise<Optional<string>>;
    protected createManifest(): Promise<void>;
    protected formatResult(): GitDiffCommandResult;
}
