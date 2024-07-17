import { RegistryAccess } from '@salesforce/source-deploy-retrieve';
import { StringMap } from '@salesforce/source-tracking/lib/shared/local/types.js';
type AddedAndDeletedFilenames = {
    added: Set<string>;
    deleted: Set<string>;
};
type StringMapsForMatches = {
    /** these matches filename=>basename, metadata type/name, and git object hash */
    fullMatches: StringMap;
    /** these did not match the hash.  They *probably* are matches where the "add" is also modified */
    deleteOnly: StringMap;
};
/** composed functions to simplified use by the shadowRepo class */
export declare const filenameMatchesToMap: (isWindows: boolean) => (registry: RegistryAccess) => (projectPath: string) => (gitDir: string) => ({ added, deleted }: AddedAndDeletedFilenames) => Promise<StringMapsForMatches>;
export {};
