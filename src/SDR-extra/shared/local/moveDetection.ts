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
// https://github.com/forcedotcom/source-tracking/blob/main/src/shared/local/moveDetection.ts
import path from 'node:path';
import { isUtf8 } from 'node:buffer';
import { Lifecycle, Logger } from '@salesforce/core';
import {
  MetadataResolver,
  SourceComponent,
  RegistryAccess,
  VirtualTreeContainer,
} from '@salesforce/source-deploy-retrieve';
import { isDefined } from '@salesforce/source-tracking/lib/shared/guards.js';
import { uniqueArrayConcat } from '@salesforce/source-tracking/lib/shared/functions.js';
import { IS_WINDOWS } from '@salesforce/source-tracking/lib/shared/local/functions.js';
import {
  AddAndDeleteMaps,
  DetectionFileInfo,
  DetectionFileInfoWithType,
  StringMap,
} from '@salesforce/source-tracking/lib/shared/local/types.js';
import { GitRepo } from './localGitRepo.js';

const ensureWindows = (filepath: string): string => path.win32.normalize(filepath);

const JOIN_CHAR = '#__#'; // the __ makes it unlikely to be used in metadata names
type AddAndDeleteFileInfos = Readonly<{ addedInfo: DetectionFileInfo[]; deletedInfo: DetectionFileInfo[] }>;
type AddAndDeleteFileInfosWithTypes = {
  addedInfo: DetectionFileInfoWithType[];
  deletedInfo: DetectionFileInfoWithType[];
};
type AddedAndDeletedFilenames = { added: Set<string>; deleted: Set<string> };
type StringMapsForMatches = {
  /** these matches filename=>basename, metadata type/name, and git object hash */
  fullMatches: StringMap;
  /** these did not match the hash.  They *probably* are matches where the "add" is also modified */
  deleteOnly: StringMap;
};

/** composed functions to simplified use by the shadowRepo class */
export const filenameMatchesToMap =
  (registry: RegistryAccess) =>
  (projectPath: string) =>
  async ({ added, deleted }: AddedAndDeletedFilenames): Promise<StringMapsForMatches> => {
    if (added.size === 0 || deleted.size === 0) {
      return { fullMatches: new Map(), deleteOnly: new Map() };
    }

    const resolver = new MetadataResolver(
      registry,
      VirtualTreeContainer.fromFilePaths(uniqueArrayConcat(added, deleted)),
    );

    const localRepo = GitRepo.getInstance({
      dir: projectPath,
      registry,
    });

    return compareHashes(
      await buildMaps(
        addTypes(resolver)(
          await toFileInfo({
            added,
            deleted,
            localRepo,
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

  // If we detected any files that have the same basename and hash, emit a warning
  // These files will still show up as expected in the `sf project deploy preview` output
  // We could add more logic to determine and display filepaths that we ignored...
  // but this is likely rare enough to not warrant the added complexity
  if (addedIgnoredMap.size || deletedIgnoredMap.size) {
    const message =
      'Files were found that have the same basename, hash, metadata type, and parent. Skipping the commit of these files';
    const logger = Logger.childFromRoot('@jayree/sfdx-plugin-manifest:SDR-extra:moveDetection:compareHashes');
    logger.warn(message);
    const lifecycle = Lifecycle.getInstance();
    await lifecycle.emitWarning(message);
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
  added,
  deleted,
  localRepo,
}: {
  added: Set<string>;
  deleted: Set<string>;
  localRepo: GitRepo;
}): Promise<AddAndDeleteFileInfos> => {
  const [headRef, autocrlf] = await Promise.all([localRepo.resolveRef('HEAD'), localRepo.getConfig('core.autocrlf')]);
  if (!headRef) {
    throw new Error(`Could not resolve HEAD for repository at ${localRepo.dir}`);
  }
  const [addedInfo, deletedInfo] = await Promise.all([
    Promise.all(Array.from(added).map(getHashForAddedFile(localRepo, autocrlf))),
    Promise.all(Array.from(deleted).map(getHashFromActualFileContents(localRepo)(headRef))),
  ]);

  return { addedInfo, deletedInfo };
};

/** returns a map of <hash+basename, filepath>.  If two items result in the same hash+basename, return that in the ignore bucket */
const buildMap = (info: DetectionFileInfoWithType[]): StringMap[] => {
  const map: StringMap = new Map();
  const ignore: StringMap = new Map();

  for (const i of info) {
    const key = toKey(i);
    // If we find a duplicate key, we need to remove it and ignore it in the future.
    // Finding duplicate hash#basename means that we cannot accurately determine where it was moved to or from
    if (map.has(key) || ignore.has(key)) {
      map.delete(key);
      ignore.set(key, i.filename);
    } else {
      map.set(key, i.filename);
    }
  }

  return [map, ignore];
};

const getHashForAddedFile =
  (localRepo: GitRepo, autocrlf: string) =>
  async (filepath: string): Promise<DetectionFileInfo> => {
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

const resolveType =
  (resolver: MetadataResolver) =>
  (filenames: string[]): SourceComponent[] => {
    const logger = Logger.childFromRoot('@jayree/sfdx-plugin-manifest:SDR-extra:moveDetection:compareTypes');
    return filenames
      .flatMap((filename) => {
        try {
          return resolver.getComponentsFromPath(filename);
        } catch {
          logger.warn(`unable to resolve ${filename}`);
          return undefined;
        }
      })
      .filter(isDefined);
  };

/** where we don't have git objects to use, read the file contents to generate the hash */
const getHashFromActualFileContents =
  (localRepo: GitRepo) =>
  (oid: string) =>
  async (filepath: string): Promise<DetectionFileInfo> => ({
    filename: filepath,
    basename: path.basename(filepath),
    hash: await localRepo.readOid(filepath, oid),
  });

const toKey = (input: DetectionFileInfoWithType): string =>
  [input.hash, input.basename, input.type, input.parentType ?? '', input.parentFullName ?? ''].join(JOIN_CHAR);

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
