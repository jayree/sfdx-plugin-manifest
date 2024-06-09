import { ComponentSet, OptionalTreeRegistryOptions } from '@salesforce/source-deploy-retrieve';
export type FromGitDiffOptions = {
    /**
     * Git ref to resolve components against
     */
    ref: string | string[];
    /**
     * File paths or directory paths to resolve components against
     */
    fsPaths?: string[];
} & OptionalTreeRegistryOptions;
export declare class ComponentSetExtra extends ComponentSet {
    /**
     * Resolve metadata components from git diff <ref> HEAD.
     *
     * @param ref Git ref to resolve components against HEAD
     * @returns ComponentSet of source resolved components
     */
    static fromGitDiff(ref: string): Promise<ComponentSet>;
    /**
     * Resolve metadata components from git diff <ref1> <ref2>.
     *
     * @param refs Git refs to resolve components against
     * @returns ComponentSet of source resolved components
     */
    static fromGitDiff(refs: string[]): Promise<ComponentSet>;
    /**
     * Resolve metadata components from git diff.
     * Customize the resolution process using an options object, such as specifying filters
     * and resolving against a different file system abstraction (see {@link TreeContainer}).
     *
     * @param options
     * @returns ComponentSet of source resolved components
     */
    static fromGitDiff(options: FromGitDiffOptions): Promise<ComponentSet>;
}
