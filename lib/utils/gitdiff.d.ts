import { ComponentSet, VirtualTreeContainer, SourceComponent, NodeFSTreeContainer as FSTreeContainer } from '@salesforce/source-deploy-retrieve';
import Debug from 'debug';
import git from 'isomorphic-git';
export declare const debug: Debug.Debugger;
type gitResults = {
    manifest: ComponentSet;
    output: {
        unchanged: string[];
        ignored: {
            ref1: string[];
            ref2: string[];
        };
        counts: {
            added: number;
            deleted: number;
            modified: number;
            unchanged: number;
            ignored: number;
            error: number;
        };
        errors: string[];
    };
};
type git = {
    ref1: string;
    ref2: string;
    refString: string;
};
export type gitLines = Array<{
    path: string;
    status: string;
}>;
export declare function resolveRef(refOrig: string, dir: string): Promise<string>;
export declare function getGitArgsFromArgv(ref1: string, ref2: string, argv: string[], dir: string): Promise<git>;
export declare function ensureOSPath(path: string): string;
export declare function ensureGitPath(path: string): string;
export declare function createVirtualTreeContainer(ref: string, dir: string, modifiedFiles: string[]): Promise<VirtualTreeContainer>;
export declare function analyzeFile(path: string, ref1VirtualTreeContainer: VirtualTreeContainer, ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer): Promise<{
    path: string;
    status: number;
    toManifest?: SourceComponent[];
    toDestructiveChanges?: SourceComponent[];
}>;
export declare function getUniqueIdentifier(component: SourceComponent): string;
export declare function getFileStateChanges(commitHash1: string, commitHash2: string, dir: string): Promise<[
    {
        path: string;
        status: string;
    }
]>;
export declare function getGitDiff(sfdxProjectFolders: string[], ref1: string, ref2: string, dir: string): Promise<gitLines>;
export declare function getGitResults(gitLines: gitLines, ref1VirtualTreeContainer: VirtualTreeContainer, ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer, destructiveChangesOnly: boolean, fsPaths: string[]): Promise<gitResults>;
export declare function fixComponentSetChilds(cs: ComponentSet): ComponentSet;
export {};
