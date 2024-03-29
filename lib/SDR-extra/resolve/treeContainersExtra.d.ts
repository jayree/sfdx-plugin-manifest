import { VirtualTreeContainer } from '@salesforce/source-deploy-retrieve';
export { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils/index.js';
export declare class VirtualTreeContainerExtra extends VirtualTreeContainer {
    /**
     * Designed for recreating virtual files from a git ref
     * To support use of MetadataResolver to also resolve metadata xmls file names can be provided
     *
     * @param ref git ref
     * @param dir git dir
     * @param includeBufferForFiles full paths to modified files
     * @returns VirtualTreeContainer
     */
    static fromGitRef(ref: string, gitDir: string, includeBufferForFiles: string[]): Promise<VirtualTreeContainer>;
}
