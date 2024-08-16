import { ComponentSet, RegistryAccess, MetadataResolver } from '@salesforce/source-deploy-retrieve';
import { NamedPackageDir } from '@salesforce/core';
import { VirtualTreeContainerExtra } from '../resolve/treeContainersExtra.js';
type GroupedFileInput = {
    packageDirs: NamedPackageDir[];
    adds: string[];
    modifies: string[];
    deletes: string[];
};
type GroupedFile = {
    path: string;
    adds: string[];
    modifies: string[];
    deletes: string[];
};
export declare const getGroupedFiles: (input: GroupedFileInput, byPackageDir?: boolean) => GroupedFile[];
export declare const getComponentSets: ({ groupings, sourceApiVersion, registry, resolverForNonDeletes, resolverForDeletes, virtualTreeContainer, }: {
    groupings: GroupedFile[];
    sourceApiVersion?: string;
    registry: RegistryAccess;
    resolverForNonDeletes: MetadataResolver;
    resolverForDeletes: MetadataResolver;
    virtualTreeContainer: VirtualTreeContainerExtra;
}) => ComponentSet[];
export {};
