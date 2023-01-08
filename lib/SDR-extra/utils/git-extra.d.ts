/// <reference types="node" resolution-mode="require"/>
import { CallbackFsClient, PromiseFsClient } from 'isomorphic-git';
export { CallbackFsClient, PromiseFsClient } from 'isomorphic-git';
interface RefOptions {
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
export declare function resolveMultiRefString(options: RefOptions): Promise<{
    ref1: string;
    ref2: string;
}>;
export declare function resolveSingleRefString(options: RefOptions): Promise<string>;
interface FileStateOptions {
    /**
     * File paths or directory paths to resolve components against
     */
    ref1: string;
    /**
     * File paths or directory paths to resolve components against
     */
    ref2: string;
    /**
     * File paths or directory paths to resolve components against
     */
    dir: string;
    /**
     * File paths or directory paths to resolve components against
     */
    fs: CallbackFsClient | PromiseFsClient;
}
export declare function getFileState(options: FileStateOptions): Promise<[
    {
        path: string;
        status: string;
    }
]>;
export declare function getStatus(options: RefOptions): Promise<Array<{
    path: string;
    status: string;
}>>;
export declare function listFullPathFiles(options: RefOptions): Promise<string[]>;
export declare function getOid(options: RefOptions): Promise<string>;
interface BlobOptions {
    /**
     * File paths or directory paths to resolve components against
     */
    oid: string;
    /**
     * File paths or directory paths to resolve components against
     */
    filename: string;
    /**
     * File paths or directory paths to resolve components against
     */
    dir: string;
    /**
     * File paths or directory paths to resolve components against
     */
    fs: CallbackFsClient | PromiseFsClient;
}
export declare function readBlobAsBuffer(options: BlobOptions): Promise<Buffer>;
