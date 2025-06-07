/*
 * Copyright 2025, jayree
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
import { sep, normalize } from 'node:path';
import { isString } from '@salesforce/ts-types';
const nonEmptyStringFilter = (value) => isString(value) && value.length > 0;
export const pathIsInFolder = (folder) => (filePath) => {
    if (folder === filePath) {
        return true;
    }
    // use sep to ensure a folder like foo will not match a filePath like foo-bar
    // comparing foo/ to foo-bar/ ensure this.
    const normalizedFolderPath = normalize(`${folder}${sep}`);
    const normalizedFilePath = normalize(`${filePath}${sep}`);
    if (normalizedFilePath.startsWith(normalizedFolderPath)) {
        return true;
    }
    const filePathParts = normalizedFilePath.split(sep).filter(nonEmptyStringFilter);
    return normalizedFolderPath
        .split(sep)
        .filter(nonEmptyStringFilter)
        .every((part, index) => part === filePathParts[index]);
};
//# sourceMappingURL=functions.js.map