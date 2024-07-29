import { StatusRow } from 'isomorphic-git';
export declare function statusMatrix({ dir, gitdir, ref1, ref2, filepaths, filter, ignored: shouldIgnore, }: {
    dir: string;
    gitdir?: string;
    ref1: string;
    ref2?: string;
    filepaths?: string[];
    filter?: ((arg0: string) => boolean) | undefined;
    ignored?: boolean;
}): Promise<StatusRow[]>;
