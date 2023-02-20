/// <reference types="node" />
interface GitRepoOptions {
    gitDir: string;
    packageDirs?: string[];
}
export declare class GitRepo {
    private static instanceMap;
    gitDir: string;
    private packageDirs;
    private constructor();
    static getInstance(options: GitRepoOptions): GitRepo;
    resolveMultiRefString(ref: string): Promise<{
        ref1: string;
        ref2: string;
    }>;
    resolveSingleRefString(ref: string | undefined): Promise<string>;
    getStatus(ref: string): Promise<Array<{
        path: string;
        status: string | undefined;
    }>>;
    getFileState(options: {
        ref1: string;
        ref2: string;
    }): Promise<[
        {
            path: string;
            status: string;
        }
    ]>;
    listFullPathFiles(ref: string): Promise<string[]>;
    getOid(ref: string): Promise<string>;
    readBlobAsBuffer(options: {
        oid: string;
        filename: string;
    }): Promise<Buffer>;
    private getCommitLog;
    private ensureGitRelPath;
}
export {};
