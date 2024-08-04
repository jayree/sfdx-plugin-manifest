/*
 * Copyright (c) 2023, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// https://github.com/isomorphic-git/isomorphic-git/blob/main/src/utils/worthWalking.js
export const worthWalking = (filepath: string, root: string): boolean => {
  if (filepath === '.' || root == null || root.length === 0 || root === '.') {
    return true;
  }
  if (root.length >= filepath.length) {
    return root.startsWith(filepath);
  } else {
    return filepath.startsWith(root);
  }
};
