import { FlagsConfig } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { JayreeSfdxCommand } from '../../../../jayreeSfdxCommand';
export default class GitDiff extends JayreeSfdxCommand {
    static description: string;
    static examples: string[];
    static args: {
        name: string;
        required: boolean;
        description: string;
        parse: (input: string) => string;
        hidden: boolean;
    }[];
    protected static flagsConfig: FlagsConfig;
    protected static requiresUsername: boolean;
    protected static supportsDevhubUsername: boolean;
    protected static requiresProject: boolean;
    private isOutputEnabled;
    private outputDir;
    run(): Promise<AnyJson>;
}
