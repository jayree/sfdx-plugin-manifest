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
import git from 'isomorphic-git';
import fs from 'graceful-fs';
import { isDefined } from '@salesforce/source-tracking/lib/shared/guards.js';
import { ensureWindows } from '@salesforce/source-tracking/lib/shared/local/functions.js';
const JOIN_CHAR = '#__#'; // the __ makes it unlikely to be used in metadata names
/** composed functions to simplified use by the shadowRepo class */
export const filenameMatchesToMap = (isWindows) => (registry) => (projectPath) => (gitDir) => async ({ added, deleted }) => excludeNonMatchingTypes(isWindows)(registry)(compareHashes(await buildMaps(await toFileInfo({
    projectPath,
    gitDir,
    added,
    deleted,
}))));
export const getLogMessage = (matches) => [
    ...[...matches.fullMatches.entries()].map(([add, del]) => `The file ${del} moved to ${add} was ignored`),
    ...[...matches.deleteOnly.entries()].map(([add, del]) => `The file ${del} moved to ${add} and modified was processed`),
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
        const message = 'Files were found that have the same basename and hash.';
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
            // these are an exact basename and hash match
            deletedMap.delete(addedKey);
            addedMap.delete(addedKey);
            return [addedValue, deletedValue];
        }
    })
        .filter(isDefined));
    if (addedMap.size && deletedMap.size) {
        // the remaining deletes didn't match the basename+hash of an add, and vice versa.
        // They *might* match the basename of an add, in which case we *could* have the "move, then edit" case.
        const addedBasenameMap = new Map([...addedMap.entries()].map(hashEntryToBasenameEntry));
        const deletedBasenameMap = new Map([...deletedMap.entries()].map(hashEntryToBasenameEntry));
        const deleteOnly = new Map(Array.from(deletedBasenameMap.entries())
            .filter(([k]) => addedBasenameMap.has(k))
            .map(([k, v]) => [addedBasenameMap.get(k), v]));
        return { fullMatches: matches, deleteOnly };
    }
    return { fullMatches: matches, deleteOnly: new Map() };
};
/** given a StringMap, resolve the metadata types and return things that having matching type/parent  */
const excludeNonMatchingTypes = (isWindows) => (registry) => ({ fullMatches: matches, deleteOnly }) => {
    if (!matches.size && !deleteOnly.size)
        return { fullMatches: matches, deleteOnly };
    const [resolvedAdded, resolvedDeleted] = [
        [...matches.keys(), ...deleteOnly.keys()], // the keys/values are only used for the resolver, so we use 1 for both add and delete
        [...matches.values(), ...deleteOnly.values()],
    ]
        .map((filenames) => filenames.map(isWindows ? ensureWindows : stringNoOp))
        .map((filenames) => new MetadataResolver(registry, VirtualTreeContainer.fromFilePaths(filenames)))
        .map(resolveType);
    return {
        fullMatches: new Map([...matches.entries()].filter(typeFilter(isWindows)(resolvedAdded, resolvedDeleted))),
        deleteOnly: new Map([...deleteOnly.entries()].filter(typeFilter(isWindows)(resolvedAdded, resolvedDeleted))),
    };
};
const typeFilter = (isWindows) => (resolveAdd, resolveDelete) => ([added, deleted]) => {
    const [resolvedAdded] = resolveAdd(isWindows ? [ensureWindows(added)] : [added]);
    const [resolvedDeleted] = resolveDelete(isWindows ? [ensureWindows(deleted)] : [deleted]);
    return (resolvedAdded?.type.name === resolvedDeleted?.type.name &&
        resolvedAdded?.parent?.name === resolvedDeleted?.parent?.name &&
        resolvedAdded?.parent?.type.name === resolvedDeleted?.parent?.type.name);
};
/** enrich the filenames with basename and oid (hash)  */
const toFileInfo = async ({ projectPath, gitDir, added, deleted, }) => {
    const headRef = await git.resolveRef({ fs, dir: projectPath, gitdir: gitDir, ref: 'HEAD' });
    const [addedInfo, deletedInfo] = await Promise.all([
        await Promise.all(Array.from(added).map(getHashForAddedFile(projectPath))),
        await Promise.all(Array.from(deleted).map(getHashFromActualFileContents(gitDir)(projectPath)(headRef))),
    ]);
    return { addedInfo, deletedInfo };
};
/** returns a map of <hash+basename, filepath>.  If two items result in the same hash+basename, return that in the ignore bucket */
const buildMap = (info) => {
    const map = new Map();
    const ignore = new Map();
    info.map((i) => {
        const key = `${i.hash}${JOIN_CHAR}${i.basename}`;
        // If we find a duplicate key, we need to remove it and ignore it in the future.
        // Finding duplicate hash#basename means that we cannot accurately determine where it was moved to or from
        if (map.has(key) || ignore.has(key)) {
            map.delete(key);
            ignore.set(key, i.filename);
        }
        else {
            map.set(key, i.filename);
        }
    });
    return [map, ignore];
};
const getHashForAddedFile = (projectPath) => async (filepath) => {
    const autocrlf = (await git.getConfig({
        fs,
        dir: projectPath,
        path: 'core.autocrlf',
    }));
    let object = await fs.promises.readFile(path.join(projectPath, filepath));
    if (autocrlf === 'true' && isUtf8(object)) {
        object = Buffer.from(object.toString('utf8').replace(/\r\n/g, '\n'));
    }
    const hash = (await git.hashBlob({ object })).oid;
    return {
        filename: filepath,
        basename: path.basename(filepath),
        hash,
    };
};
const resolveType = (resolver) => (filenames) => filenames
    .flatMap((filename) => {
    try {
        return resolver.getComponentsFromPath(filename);
    }
    catch (e) {
        return undefined;
    }
})
    .filter(isDefined);
/** where we don't have git objects to use, read the file contents to generate the hash */
const getHashFromActualFileContents = (gitdir) => (projectPath) => (oid) => async (filepath) => ({
    filename: filepath,
    basename: path.basename(filepath),
    hash: (await git.readBlob({ fs, dir: projectPath, gitdir, filepath, oid })).oid,
});
const hashEntryToBasenameEntry = ([k, v]) => [hashToBasename(k), v];
const hashToBasename = (hash) => hash.split(JOIN_CHAR)[1];
const stringNoOp = (s) => s;
//# sourceMappingURL=moveDetection.js.map