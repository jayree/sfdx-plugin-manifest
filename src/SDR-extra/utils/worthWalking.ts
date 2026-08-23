/*
 * Copyright 2026, jayree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// https://github.com/isomorphic-git/isomorphic-git/blob/main/src/utils/worthWalking.js
export const worthWalking = (filepath: string, root: string): boolean => {
  if (filepath === '.' || root == null || root.length === 0 || root === '.') {
    return true;
  }
  // A shared prefix only counts when it lands on a path component boundary,
  // otherwise the root 'src' would also pull in 'src2/a.js' and 'srcfoo.txt'.
  const base = root.endsWith('/') ? root.slice(0, -1) : root;
  if (base === '.') {
    return true;
  }
  if (base.length >= filepath.length) {
    // Keep walking while filepath is still an ancestor of the wanted root.
    return base === filepath || base.startsWith(`${filepath}/`);
  }
  return filepath.startsWith(`${base}/`);
};
