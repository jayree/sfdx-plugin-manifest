import { ComponentSet } from '@salesforce/source-deploy-retrieve';
import Debug from 'debug';
export declare const debug: Debug.Debugger;
/**
 * Resolver for metadata type and component objects from a git diff result
 *
 * @internal
 */
export declare class GitDiffResolver {
    private ref1VirtualTreeContainer;
    private ref2VirtualTreeContainer;
    private ref1Resolver;
    private ref2Resolver;
    private static getFileStatus;
    resolve(ref1: string, ref2: string, fsPaths: string[]): Promise<ComponentSet>;
    private getComponentSet;
    private getChildComponentStatus;
}
