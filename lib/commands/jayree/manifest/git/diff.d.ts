import { ArgInput } from '@oclif/core/lib/interfaces';
import { FlagsConfig } from '@salesforce/command';
import { AnyJson } from '@salesforce/ts-types';
import { JayreeSfdxCommand } from '../../../../jayreeSfdxCommand.js';
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
    private sfdxProjectFolders;
    private sourceApiVersion;
    private destructiveChanges;
    private manifest;
    private gitLines;
    private ref1VirtualTreeContainer;
    private ref2VirtualTreeContainer;
    private componentSet;
    private outputErrors;
    private fsPaths;
    run(): Promise<AnyJson>;
}
