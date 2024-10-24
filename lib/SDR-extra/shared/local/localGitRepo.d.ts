import { StatusRow } from 'isomorphic-git';
import { NamedPackageDir } from '@salesforce/core';
import { RegistryAccess } from '@salesforce/source-deploy-retrieve';
export declare const STAGE = 3;
export type GitRepoOptions = {
    dir: string;
    packageDirs?: NamedPackageDir[];
    registry?: RegistryAccess;
};
export declare class GitRepo {
    private static instanceMap;
    dir: string;
    private packageDirs;
    private status;
    private cache;
    private lifecycle;
    private readonly registry;
    private constructor();
    static getInstance(options: GitRepoOptions): GitRepo;
    resolveRef(ref: string): Promise<string | undefined>;
    getConfig(p: string): Promise<string>;
    hashBlob(object: Buffer): Promise<string>;
    listFiles(ref: string): Promise<string[]>;
    readBlob(filepath: string, oid?: string): Promise<Buffer>;
    readOid(filepath: string, oid: string): Promise<string>;
    resolveMultiRefString(ref: string): Promise<{
        ref1: string;
        ref2: string;
    }>;
    resolveSingleRefString(ref: string | undefined): Promise<string>;
    getAdds(): StatusRow[];
    getAddFilenames(): string[];
    getModifies(): StatusRow[];
    getModifyFilenames(): string[];
    getDeletes(): StatusRow[];
    getDeleteFilenames(): string[];
    getStatus(ref1: string, ref2?: string): Promise<StatusRow[]>;
    emitStatusWarnings(): Promise<void>;
    private detectMovedFiles;
    private getCommitLog;
    private checkLocalGitAutocrlfConfig;
}
