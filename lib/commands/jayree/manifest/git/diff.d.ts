import { SfCommand } from '@salesforce/sf-plugins-core';
import { Optional } from '@salesforce/ts-types';
export interface GitDiffCommandResult {
    destructiveChanges: object;
    manifest: object;
}
export default class GitDiff extends SfCommand<GitDiffCommandResult> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly args: {
        ref1: import("@oclif/core/lib/interfaces/parser.js").Arg<string, Record<string, unknown>>;
        ref2: import("@oclif/core/lib/interfaces/parser.js").Arg<string, Record<string, unknown>>;
    };
    static readonly requiresProject = true;
    static readonly flags: {
        'source-dir': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string[], import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        'output-dir': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        'destructive-changes-only': import("@oclif/core/lib/interfaces/parser.js").BooleanFlag<boolean>;
    };
    private isOutputEnabled;
    private outputDir;
    private destructiveChangesOnly;
    private projectRoot;
    private sourceApiVersion;
    private destructiveChanges;
    private manifest;
    private gitLines;
    private ref1VirtualTreeContainer;
    private ref2VirtualTreeContainer;
    private componentSet;
    private outputErrors;
    private outputWarnings;
    private fsPaths;
    run(): Promise<GitDiffCommandResult>;
    protected getSourceApiVersion(): Promise<Optional<string>>;
}
