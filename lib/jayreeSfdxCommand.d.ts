import { SfdxCommand } from '@salesforce/command';
export declare abstract class JayreeSfdxCommand extends SfdxCommand {
    protected warnIfRunByAlias(aliases: string[], id: string): void;
    protected getFlag<T>(flagName: string, defaultVal?: unknown): T;
}
