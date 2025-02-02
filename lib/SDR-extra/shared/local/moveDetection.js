/*
 * Copyright (c) 2023, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// https://github.com/forcedotcom/source-tracking/blob/main/src/shared/local/moveDetection.ts
import path from 'node:path';
import { isUtf8 } from 'node:buffer';
import { Lifecycle } from '@salesforce/core';
import { MetadataResolver, VirtualTreeContainer, } from '@salesforce/source-deploy-retrieve';
import { Performance } from '@oclif/core/performance';
import { isDefined } from '@salesforce/source-tracking/lib/shared/guards.js';
import { uniqueArrayConcat } from '@salesforce/source-tracking/lib/shared/functions.js';
import { IS_WINDOWS, ensureWindows } from '@salesforce/source-tracking/lib/shared/local/functions.js';
import { buildMap } from '@salesforce/source-tracking/lib/shared/local/moveDetection.js';
import { GitRepo } from './localGitRepo.js';
const JOIN_CHAR = '#__#'; // the __ makes it unlikely to be used in metadata names
let localRepo;
/** composed functions to simplified use by the shadowRepo class */
export const filenameMatchesToMap = (registry) => (projectPath) => async ({ added, deleted }) => {
    const resolver = new MetadataResolver(registry, VirtualTreeContainer.fromFilePaths(uniqueArrayConcat(added, deleted)));
    localRepo = GitRepo.getInstance({
        dir: projectPath,
        registry,
    });
    return compareHashes(await buildMaps(addTypes(resolver)(await toFileInfo({
        added,
        deleted,
    }))));
};
export const getLogMessage = (matches) => [
    ...[...matches.fullMatches.entries()].map(([add, del]) => `The file ${IS_WINDOWS ? ensureWindows(del) : del} moved to ${IS_WINDOWS ? ensureWindows(add) : add} was ignored.`),
    ...[...matches.deleteOnly.entries()].map(([add, del]) => `The file ${IS_WINDOWS ? ensureWindows(del) : del} moved to ${IS_WINDOWS ? ensureWindows(add) : add} and modified was processed.`),
];
/** build maps of the add/deletes with filenames, returning the matches  Logs if we can't make a match because buildMap puts them in the ignored bucket */
const buildMaps = async ({ addedInfo, deletedInfo }) => {
    const [addedMap, addedIgnoredMap] = buildMap(addedInfo);
    const [deletedMap, deletedIgnoredMap] = buildMap(deletedInfo);
    // If we detected any files that have the same basename and hash, emit a warning and send telemetry
    // These files will still show up as expected in the `sf project deploy preview` output
    // We could add more logic to determine and display filepaths that we ignored...
    // but this is likely rare enough to not warrant the added complexity
    // Telemetry will help us determine how often this occurs
    if (addedIgnoredMap.size || deletedIgnoredMap.size) {
        const message = 'Files were found that have the same basename, hash, metadata type, and parent.';
        const lifecycle = Lifecycle.getInstance();
        await Promise.all([lifecycle.emitWarning(message)]);
    }
    return { addedMap, deletedMap };
};
/**
 * builds a map of the values from both maps
 * side effect: mutates the passed-in maps!
 */
const compareHashes = ({ addedMap, deletedMap }) => {
    const matches = new Map([...addedMap.entries()]
        .map(([addedKey, addedValue]) => {
        const deletedValue = deletedMap.get(addedKey);
        if (deletedValue) {
            // these are an exact basename + hash match + parent + type
            deletedMap.delete(addedKey);
            addedMap.delete(addedKey);
            return [addedValue, deletedValue];
        }
    })
        .filter(isDefined));
    if (addedMap.size && deletedMap.size) {
        // the remaining deletes didn't match the basename+hash of an add, and vice versa.
        // They *might* match the basename,type,parent of an add, in which case we *could* have the "move, then edit" case.
        const addedMapNoHash = new Map([...addedMap.entries()].map(removeHashFromEntry));
        const deletedMapNoHash = new Map([...deletedMap.entries()].map(removeHashFromEntry));
        const deleteOnly = new Map(Array.from(deletedMapNoHash.entries())
            .filter(([k]) => addedMapNoHash.has(k))
            .map(([k, v]) => [addedMapNoHash.get(k), v]));
        return { fullMatches: matches, deleteOnly };
    }
    return { fullMatches: matches, deleteOnly: new Map() };
};
/** enrich the filenames with basename and oid (hash)  */
const toFileInfo = async ({ added, deleted, }) => {
    const getInfoMarker = Performance.mark('@jayree/sfdx-plugin-manifest', 'localGitRepo.detectMovedFiles#toFileInfo', {
        addedFiles: added.size,
        deletedFiles: deleted.size,
    });
    const headRef = (await localRepo.resolveRef('HEAD'));
    const [addedInfo, deletedInfo] = await Promise.all([
        await Promise.all(Array.from(added).map(getHashForAddedFile)),
        await Promise.all(Array.from(deleted).map(getHashFromActualFileContents(headRef))),
    ]);
    getInfoMarker?.stop();
    return { addedInfo, deletedInfo };
};
const getHashForAddedFile = async (filepath) => {
    const autocrlf = await localRepo.getConfig('core.autocrlf');
    let object = await localRepo.readBlob(filepath);
    if (autocrlf === 'true' && isUtf8(object)) {
        object = Buffer.from(object.toString('utf8').replace(/\r\n/g, '\n'));
    }
    return {
        filename: filepath,
        basename: path.basename(filepath),
        hash: await localRepo.hashBlob(object),
    };
};
const resolveType = (resolver) => (filenames) => filenames
    .flatMap((filename) => {
    try {
        return resolver.getComponentsFromPath(filename);
    }
    catch {
        return undefined;
    }
})
    .filter(isDefined);
/** where we don't have git objects to use, read the file contents to generate the hash */
const getHashFromActualFileContents = (oid) => async (filepath) => ({
    filename: filepath,
    basename: path.basename(filepath),
    hash: await localRepo.readOid(filepath, oid),
});
const removeHashFromEntry = ([k, v]) => [removeHashFromKey(k), v];
const removeHashFromKey = (hash) => hash.split(JOIN_CHAR).splice(1).join(JOIN_CHAR);
/** resolve the metadata types (and possibly parent components) */
const addTypes = (resolver) => (info) => {
    // quick passthrough if we don't have adds and deletes
    if (!info.addedInfo.length || !info.deletedInfo.length)
        return { addedInfo: [], deletedInfo: [] };
    const applied = getTypesForFileInfo(resolveType(resolver));
    return {
        addedInfo: info.addedInfo.flatMap(applied),
        deletedInfo: info.deletedInfo.flatMap(applied),
    };
};
const getTypesForFileInfo = (appliedResolver) => (fileInfo) => appliedResolver([fileInfo.filename]).map((c) => ({
    ...fileInfo,
    type: c.type.name,
    parentType: c.parent?.type.name ?? '',
    parentFullName: c.parent?.fullName ?? '',
}));
//# sourceMappingURL=moveDetection.js.map