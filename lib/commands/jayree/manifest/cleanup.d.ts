import { FlagsConfig } from '@salesforce/command';
import { JayreeSfdxCommand } from '../../../jayreeSfdxCommand.js';
export default class CleanupManifest extends JayreeSfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: FlagsConfig;
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<void>;
}
