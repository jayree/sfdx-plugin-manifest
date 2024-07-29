/*
 * Copyright (c) 2023, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { relative } from 'node:path';
import { ensurePosix, IS_WINDOWS } from '@salesforce/source-tracking/lib/shared/local/functions.js';
export const dirToRelativePosixPath = (projectPath, fullPath) => IS_WINDOWS ? ensurePosix(relative(projectPath, fullPath)) : relative(projectPath, fullPath);
//# sourceMappingURL=functions.js.map