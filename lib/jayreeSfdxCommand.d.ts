import { SfdxCommand } from '@salesforce/command';
import { Optional } from '@salesforce/ts-types';
export declare abstract class JayreeSfdxCommand extends SfdxCommand {
    protected warnIfRunByAlias(aliases: string[], id: string): void;
    protected getFlag<T>(flagName: string, defaultVal?: unknown): T;
    protected isJsonOutput(): boolean;
    protected getSourceApiVersion(): Promise<Optional<string>>;
}
