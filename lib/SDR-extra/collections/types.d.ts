import { OptionalTreeRegistryOptions } from '@salesforce/source-deploy-retrieve';
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
