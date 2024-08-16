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
import {
  MetadataResolver,
  SourceComponent,
  RegistryAccess,
  VirtualTreeContainer,
} from '@salesforce/source-deploy-retrieve';
import git from 'isomorphic-git';
import fs from 'graceful-fs';
import { isDefined } from '@salesforce/source-tracking/lib/shared/guards.js';
import { uniqueArrayConcat } from '@salesforce/source-tracking/lib/shared/functions.js';
import { IS_WINDOWS, ensurePosix, ensureWindows } from '@salesforce/source-tracking/lib/shared/local/functions.js';
import { buildMap } from '@salesforce/source-tracking/lib/shared/local/moveDetection.js';
import {
  AddAndDeleteMaps,
  DetectionFileInfo,
  DetectionFileInfoWithType,
  StringMap,
} from '@salesforce/source-tracking/lib/shared/local/types.js';

const JOIN_CHAR = '#__#'; // the __ makes it unlikely to be used in metadata names
type AddAndDeleteFileInfos = Readonly<{ addedInfo: DetectionFileInfo[]; deletedInfo: DetectionFileInfo[] }>;
type AddAndDeleteFileInfosWithTypes = {
  addedInfo: DetectionFileInfoWithType[];
  deletedInfo: DetectionFileInfoWithType[];
};
type AddedAndDeletedFilenames = { added: Set<string>; deleted: Set<string> };
export type StringMapsForMatches = {
  /** these matches filename=>basename, metadata type/name, and git object hash */
  fullMatches: StringMap;
  /** these did not match the hash.  They *probably* are matches where the "add" is also modified */
  deleteOnly: StringMap;
};

/** composed functions to simplified use by the shadowRepo class */
export const filenameMatchesToMap =
  (registry: RegistryAccess) =>
  (projectPath: string) =>
  (gitDir: string) =>
  async ({ added, deleted }: AddedAndDeletedFilenames): Promise<StringMapsForMatches> => {
    const resolver = new MetadataResolver(
      registry,
      VirtualTreeContainer.fromFilePaths(uniqueArrayConcat(added, deleted)),
    );

    return compareHashes(
      await buildMaps(
        addTypes(resolver)(
          await toFileInfo({
            projectPath,
            gitDir,
            added,
            deleted,
          }),
        ),
      ),
    );
  };

export const getLogMessage = (matches: StringMapsForMatches): string[] => [
  ...[...matches.fullMatches.entries()].map(
    ([add, del]) =>
      `The file ${IS_WINDOWS ? ensureWindows(del) : del} moved to ${IS_WINDOWS ? ensureWindows(add) : add} was ignored.`,
  ),
  ...[...matches.deleteOnly.entries()].map(
    ([add, del]) =>
      `The file ${IS_WINDOWS ? ensureWindows(del) : del} moved to ${IS_WINDOWS ? ensureWindows(add) : add} and modified was processed.`,
  ),
];

/** build maps of the add/deletes with filenames, returning the matches  Logs if we can't make a match because buildMap puts them in the ignored bucket */
const buildMaps = async ({ addedInfo, deletedInfo }: AddAndDeleteFileInfosWithTypes): Promise<AddAndDeleteMaps> => {
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
const compareHashes = ({ addedMap, deletedMap }: AddAndDeleteMaps): StringMapsForMatches => {
  const matches = new Map<string, string>(
    [...addedMap.entries()]
      .map(([addedKey, addedValue]) => {
        const deletedValue = deletedMap.get(addedKey);
        if (deletedValue) {
          // these are an exact basename + hash match + parent + type
          deletedMap.delete(addedKey);
          addedMap.delete(addedKey);
          return [addedValue, deletedValue] as const;
        }
      })
      .filter(isDefined),
  );

  if (addedMap.size && deletedMap.size) {
    // the remaining deletes didn't match the basename+hash of an add, and vice versa.
    // They *might* match the basename,type,parent of an add, in which case we *could* have the "move, then edit" case.
    const addedMapNoHash = new Map([...addedMap.entries()].map(removeHashFromEntry));
    const deletedMapNoHash = new Map([...deletedMap.entries()].map(removeHashFromEntry));
    const deleteOnly = new Map<string, string>(
      Array.from(deletedMapNoHash.entries())
        .filter(([k]) => addedMapNoHash.has(k))
        .map(([k, v]) => [addedMapNoHash.get(k) as string, v]),
    );
    return { fullMatches: matches, deleteOnly };
  }
  return { fullMatches: matches, deleteOnly: new Map<string, string>() };
};

/** enrich the filenames with basename and oid (hash)  */
const toFileInfo = async ({
  projectPath,
  gitDir,
  added,
  deleted,
}: {
  projectPath: string;
  gitDir: string;
  added: Set<string>;
  deleted: Set<string>;
}): Promise<AddAndDeleteFileInfos> => {
  const headRef = await git.resolveRef({ fs, dir: projectPath, gitdir: gitDir, ref: 'HEAD' });
  const [addedInfo, deletedInfo] = await Promise.all([
    await Promise.all(Array.from(added).map(getHashForAddedFile(projectPath))),
    await Promise.all(Array.from(deleted).map(getHashFromActualFileContents(gitDir)(projectPath)(headRef))),
  ]);
  return { addedInfo, deletedInfo };
};

const getHashForAddedFile =
  (projectPath: string) =>
  async (filepath: string): Promise<DetectionFileInfo> => {
    const autocrlf = (await git.getConfig({
      fs,
      dir: projectPath,
      path: 'core.autocrlf',
    })) as string;

    let object = await fs.promises.readFile(path.join(projectPath, filepath));

    if (autocrlf === 'true' && isUtf8(object)) {
      object = Buffer.from(object.toString('utf8').replace(/\r\n/g, '\n'));
    }
    return {
      filename: filepath,
      basename: path.basename(filepath),
      hash: (await git.hashBlob({ object })).oid,
    };
  };

const resolveType =
  (resolver: MetadataResolver) =>
  (filenames: string[]): SourceComponent[] =>
    filenames
      .flatMap((filename) => {
        try {
          return resolver.getComponentsFromPath(filename);
        } catch (e) {
          return undefined;
        }
      })
      .filter(isDefined);

/** where we don't have git objects to use, read the file contents to generate the hash */
const getHashFromActualFileContents =
  (gitdir: string) =>
  (projectPath: string) =>
  (oid: string) =>
  async (filepath: string): Promise<DetectionFileInfo> => ({
    filename: filepath,
    basename: path.basename(filepath),
    hash: (
      await git.readBlob({ fs, dir: projectPath, gitdir, filepath: IS_WINDOWS ? ensurePosix(filepath) : filepath, oid })
    ).oid,
  });

const removeHashFromEntry = ([k, v]: [string, string]): [string, string] => [removeHashFromKey(k), v];
const removeHashFromKey = (hash: string): string => hash.split(JOIN_CHAR).splice(1).join(JOIN_CHAR);

/** resolve the metadata types (and possibly parent components) */
const addTypes =
  (resolver: MetadataResolver) =>
  (info: AddAndDeleteFileInfos): AddAndDeleteFileInfosWithTypes => {
    // quick passthrough if we don't have adds and deletes
    if (!info.addedInfo.length || !info.deletedInfo.length) return { addedInfo: [], deletedInfo: [] };
    const applied = getTypesForFileInfo(resolveType(resolver));
    return {
      addedInfo: info.addedInfo.flatMap(applied),
      deletedInfo: info.deletedInfo.flatMap(applied),
    };
  };

const getTypesForFileInfo =
  (appliedResolver: (filenames: string[]) => SourceComponent[]) =>
  (fileInfo: DetectionFileInfo): DetectionFileInfoWithType[] =>
    appliedResolver([fileInfo.filename]).map((c) => ({
      ...fileInfo,
      type: c.type.name,
      parentType: c.parent?.type.name ?? '',
      parentFullName: c.parent?.fullName ?? '',
    }));
