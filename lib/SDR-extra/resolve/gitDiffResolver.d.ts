import { ComponentSet } from '@salesforce/source-deploy-retrieve';
import { SfProject } from '@salesforce/core';
/**
 * Resolver for metadata type and component objects from a git diff result
 *
 * @internal
 */
export declare class GitDiffResolver {
    private ref2VirtualTreeContainer;
    private ref1Resolver;
    private ref2Resolver;
    private gitDir;
    private uniquePackageDirectories;
    private localRepo;
    /**
     * @param dir SFDX project directory
     */
    constructor(project: SfProject);
    resolve(ref1: string, ref2: string | undefined, fsPaths: string[] | undefined): Promise<ComponentSet>;
    private getFileStatus;
    private getComponentSet;
    private getChildComponentStatus;
}
