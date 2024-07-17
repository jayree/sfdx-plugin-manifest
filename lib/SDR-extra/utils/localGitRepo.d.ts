import { StatusRow } from 'isomorphic-git';
import { NamedPackageDir } from '@salesforce/core';
import { RegistryAccess } from '@salesforce/source-deploy-retrieve';
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
    getStatus(ref1: string, ref2?: string): Promise<StatusRow[]>;
    getStatusText(ref1: string, ref2?: string): Promise<Array<{
        path: string;
        status: string | undefined;
    }>>;
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
        filename: string;
    }): Promise<Buffer>;
    private detectMovedFiles;
    private getCommitLog;
    private ensureGitRelPath;
    private checkLocalGitAutocrlfConfig;
}
