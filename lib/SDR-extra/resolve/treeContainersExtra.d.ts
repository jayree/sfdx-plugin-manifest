import { VirtualTreeContainer } from '@salesforce/source-deploy-retrieve';
export declare class VirtualTreeContainerExtra extends VirtualTreeContainer {
    /**
     * Designed for recreating virtual files from file paths and their buffer content
     * This was created to support use of MetadataResolver with git diff results where the modified files and their content can be provided but the files don't actually exist on the filesystem
     *
     * @param paths full paths to files
     * @param fileBufferByPath map of file paths to their buffer content
     * @returns VirtualTreeContainer
     */
    static fromFilePathsWithBlobs(paths: string[], fileBufferByPath: Map<string, Buffer>): VirtualTreeContainer;
    /**
     * Designed for recreating virtual files from a git ref
     * This was created to support use of MetadataResolver with git diff results where the modified files and their content can be provided but the files don't actually exist on the filesystem
     *
     * @param ref git ref
     * @param dir git dir
     * @param includeBufferForFiles full paths to modified files
     * @returns VirtualTreeContainer
     */
    static fromGitRef(ref: string, dir: string, includeBufferForFiles: string[]): Promise<VirtualTreeContainer>;
}
