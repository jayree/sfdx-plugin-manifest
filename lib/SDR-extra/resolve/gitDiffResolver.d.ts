import { ComponentSet } from '@salesforce/source-deploy-retrieve';
import { SfProject } from '@salesforce/core';
import Debug from 'debug';
import { CallbackFsClient, PromiseFsClient } from '../utils/git-extra.js';
export declare const debug: Debug.Debugger;
/**
 * Resolver for metadata type and component objects from a git diff result
 *
 * @internal
 */
export declare class GitDiffResolver {
    private fs;
    private ref2VirtualTreeContainer;
    private ref1Resolver;
    private ref2Resolver;
    private dir;
    private uniquePackageDirectories;
    /**
     * @param dir SFDX project directory
     */
    constructor(project: SfProject, fs: CallbackFsClient | PromiseFsClient);
    resolve(ref1: string, ref2: string, fsPaths: string[]): Promise<ComponentSet>;
    private getFileStatus;
    private getComponentSet;
    private getChildComponentStatus;
}
