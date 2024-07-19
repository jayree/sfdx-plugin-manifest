import { StatusRow } from 'isomorphic-git';
import { NamedPackageDir } from '@salesforce/core';
import { RegistryAccess } from '@salesforce/source-deploy-retrieve';
export declare const FILE = 0;
export declare const HEAD = 1;
export declare const WORKDIR = 2;
export declare const STAGE = 3;
export type GitRepoOptions = {
    dir: string;
    packageDirs: NamedPackageDir[];
    registry: RegistryAccess;
};
export declare class GitRepo {
    private static instanceMap;
    dir: string;
    private packageDirs;
    private status;
    private lifecycle;
    private readonly registry;
    private constructor();
    static getInstance(options: GitRepoOptions): GitRepo;
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
    statusMatrix(options: {
        ref1: string;
        ref2?: string;
        filepaths?: string[];
        filter?: ((arg0: string) => boolean) | undefined;
        ignore?: boolean;
    }): Promise<StatusRow[]>;
    listFullPathFiles(ref: string): Promise<string[]>;
    getOid(ref: string): Promise<string>;
    readBlobAsBuffer(options: {
        oid: string;
        filepath: string;
    }): Promise<Buffer>;
    private detectMovedFiles;
    private getCommitLog;
    private checkLocalGitAutocrlfConfig;
}
