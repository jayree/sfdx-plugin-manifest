import { ArgInput } from '@oclif/core/lib/interfaces';
import { FlagsConfig } from '@salesforce/command';
import { JayreeSfdxCommand } from '../../../../../jayreeSfdxCommand.js';
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
export default class GitDiffCommand extends JayreeSfdxCommand {
    static description: string;
    static examples: string[];
    static args: ArgInput;
    protected static flagsConfig: FlagsConfig;
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    private outputDir;
    private manifestName;
    private destructiveChangesName;
    private outputPath;
    private componentSet;
    private destructiveChangesOnly;
    run(): Promise<GitDiffCommandResult>;
    protected createManifest(): Promise<void>;
    protected formatResult(): GitDiffCommandResult;
}
