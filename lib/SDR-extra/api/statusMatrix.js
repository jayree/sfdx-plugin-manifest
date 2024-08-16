/*
 * Copyright (c) 2023, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// https://github.com/isomorphic-git/isomorphic-git/blob/main/src/api/statusMatrix.js
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { STAGE } from 'isomorphic-git';
import { TREE } from 'isomorphic-git';
import { WORKDIR } from 'isomorphic-git';
import { walk as _walk } from 'isomorphic-git';
import { isIgnored as _isIgnored } from 'isomorphic-git';
import { worthWalking } from '../utils/worthWalking.js';
export async function statusMatrix({ dir, gitdir = join(dir, '.git'), ref1 = 'HEAD', ref2, filepaths = ['.'], filter, ignored: shouldIgnore = false, }) {
    return _walk({
        fs,
        dir,
        gitdir,
        trees: [TREE({ ref: ref1 }), ref2 ? TREE({ ref: ref2 }) : WORKDIR(), ref2 ? TREE({ ref: ref2 }) : STAGE()],
        // eslint-disable-next-line complexity
        async map(filepath, [head, workdir, stage]) {
            // Ignore ignored files, but only if they are not already tracked.
            if (!head && !stage && workdir) {
                if (!shouldIgnore) {
                    const isIgnored = await _isIgnored({
                        fs,
                        dir,
                        filepath,
                    });
                    if (isIgnored) {
                        return null;
                    }
                }
            }
            // match against base paths
            if (!filepaths.some((base) => worthWalking(filepath, base))) {
                return null;
            }
            // Late filter against file names
            if (filter) {
                if (!filter(filepath))
                    return;
            }
            const [headType, workdirType, stageType] = await Promise.all([head?.type(), workdir?.type(), stage?.type()]);
            const isBlob = [headType, workdirType, stageType].includes('blob');
            // For now, bail on directories unless the file is also a blob in another tree
            if ((headType === 'tree' || headType === 'special') && !isBlob)
                return;
            if (headType === 'commit')
                return null;
            if ((workdirType === 'tree' || workdirType === 'special') && !isBlob)
                return;
            if (stageType === 'commit')
                return null;
            if ((stageType === 'tree' || stageType === 'special') && !isBlob)
                return;
            // Figure out the oids for files, using the staged oid for the working dir oid if the stats match.
            const headOid = headType === 'blob' ? await head?.oid() : undefined;
            const stageOid = stageType === 'blob' ? await stage?.oid() : undefined;
            let workdirOid;
            if (headType !== 'blob' && workdirType === 'blob' && stageType !== 'blob') {
                // We don't actually NEED the sha. Any sha will do
                // TODO: update this logic to handle N trees instead of just 3.
                workdirOid = '42';
            }
            else if (workdirType === 'blob') {
                workdirOid = await workdir?.oid();
            }
            const entry = [undefined, headOid, workdirOid, stageOid];
            const result = entry.map((value) => entry.indexOf(value));
            result.shift(); // remove leading undefined entry
            return [filepath, ...result];
        },
    });
}
//# sourceMappingURL=statusMatrix.js.map