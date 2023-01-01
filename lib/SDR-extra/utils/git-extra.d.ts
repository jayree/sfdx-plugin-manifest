/// <reference types="node" resolution-mode="require"/>
import { CallbackFsClient, PromiseFsClient } from 'isomorphic-git';
import Debug from 'debug';
export declare const debug: Debug.Debugger;
export interface GetCommitLogOptions {
    /**
     * File paths or directory paths to resolve components against
     */
    ref: string;
    /**
     * File paths or directory paths to resolve components against
     */
    dir: string;
    /**
     * File paths or directory paths to resolve components against
     */
    fs: CallbackFsClient | PromiseFsClient;
}
interface MultiRefStringOptions {
    /**
     * File paths or directory paths to resolve components against
     */
    ref: string;
    /**
     * File paths or directory paths to resolve components against
     */
    dir: string;
    /**
     * File paths or directory paths to resolve components against
     */
    fs: CallbackFsClient | PromiseFsClient;
}
export declare function resolveMultiRefString(options: MultiRefStringOptions): Promise<{
    ref1: string;
    ref2: string;
}>;
interface SingleRefStringOptions {
    /**
     * File paths or directory paths to resolve components against
     */
    ref: string;
    /**
     * File paths or directory paths to resolve components against
     */
    dir: string;
    /**
     * File paths or directory paths to resolve components against
     */
    fs: CallbackFsClient | PromiseFsClient;
}
export declare function resolveSingleRefString(options: SingleRefStringOptions): Promise<string>;
export declare function getFileState(commitHash1: string, commitHash2: string, dir: string): Promise<[
    {
        path: string;
        status: string;
    }
]>;
export declare function getStatus(dir: string, ref: string): Promise<Array<{
    path: string;
    status: string;
}>>;
export declare function listFullPathFiles(dir: string, ref: string): Promise<string[]>;
export declare function getOid(dir: string, ref: string): Promise<string>;
export declare function readBlobAsBuffer(dir: string, oid: string, filename: string): Promise<Buffer>;
export {};
