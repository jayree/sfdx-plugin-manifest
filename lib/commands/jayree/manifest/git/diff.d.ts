import { SfCommand } from '@salesforce/sf-plugins-core';
import { Optional } from '@salesforce/ts-types';
export type GitDiffCommandResult = {
    manifest?: {
        path: string;
        name: string;
    };
    destructiveChanges?: {
        path: string;
        name: string;
    };
};
export default class GitDiffCommand extends SfCommand<GitDiffCommandResult> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly args: {
        ref1: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
        ref2: import("@oclif/core/interfaces").Arg<string | undefined, Record<string, unknown>>;
    };
    static readonly requiresProject = true;
    static readonly deprecateAliases = true;
    static readonly aliases: string[];
    static readonly flags: {
        'api-version': import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        'source-dir': import("@oclif/core/interfaces").OptionFlag<string[], import("@oclif/core/interfaces").CustomOptions>;
        'output-dir': import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        'destructive-changes-only': import("@oclif/core/interfaces").BooleanFlag<boolean>;
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
