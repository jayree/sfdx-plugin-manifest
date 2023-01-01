import { ArgInput } from '@oclif/core/lib/interfaces';
import { FlagsConfig } from '@salesforce/command';
import { JayreeSfdxCommand } from '../../../../../jayreeSfdxCommand.js';
interface CreateCommandResult {
    manifest?: {
        path: string;
        name: string;
    };
    destructiveChanges?: {
        path: string;
        name: string;
    };
}
export default class gitDiff extends JayreeSfdxCommand {
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
    run(): Promise<CreateCommandResult>;
    protected createManifest(): Promise<void>;
    protected formatResult(): CreateCommandResult;
}
export {};
