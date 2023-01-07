import { ArgInput } from '@oclif/core/lib/interfaces';
import { FlagsConfig } from '@salesforce/command';
import { JayreeSfdxCommand } from '../../../../jayreeSfdxCommand.js';
export interface GitDiffCommandResult {
    destructiveChanges: object;
    manifest: object;
}
export default class GitDiff extends JayreeSfdxCommand {
    static description: string;
    static examples: string[];
    static args: ArgInput;
    protected static flagsConfig: FlagsConfig;
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
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
}
