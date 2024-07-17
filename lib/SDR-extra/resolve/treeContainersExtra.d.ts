import { VirtualTreeContainer, RegistryAccess } from '@salesforce/source-deploy-retrieve';
import { NamedPackageDir } from '@salesforce/core';
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
    static fromGitRef(ref: string, dir: string, includeBufferForFiles: string[], packageDirs: NamedPackageDir[], registry: RegistryAccess): Promise<VirtualTreeContainer>;
}
