import { FlagsConfig } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { JayreeSfdxCommand } from '../../../jayreeSfdxCommand';
export default class CleanupManifest extends JayreeSfdxCommand {
    static description: string;
    static examples: string[];
    protected static flagsConfig: FlagsConfig;
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    run(): Promise<AnyJson>;
}
