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
    static readonly args: {
        ref1: import("@oclif/core/lib/interfaces/parser.js").Arg<string, Record<string, unknown>>;
        ref2: import("@oclif/core/lib/interfaces/parser.js").Arg<string | undefined, Record<string, unknown>>;
    };
    static readonly requiresProject = true;
    static readonly deprecateAliases = true;
    static readonly aliases: string[];
    static readonly flags: {
        'api-version': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        'source-dir': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string[], import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        'output-dir': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        'destructive-changes-only': import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
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
