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
import { isDefined } from '@salesforce/source-tracking/lib/shared/guards.js';
import { uniqueArrayConcat } from '@salesforce/source-tracking/lib/shared/functions.js';
import { IS_WINDOWS, ensureWindows } from '@salesforce/source-tracking/lib/shared/local/functions.js';
import { buildMap } from '@salesforce/source-tracking/lib/shared/local/moveDetection.js';
import {
  AddAndDeleteMaps,
  DetectionFileInfo,
  DetectionFileInfoWithType,
  StringMap,
} from '@salesforce/source-tracking/lib/shared/local/types.js';
import { GitRepo } from './localGitRepo.js';

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

let localRepo: GitRepo;

/** composed functions to simplified use by the shadowRepo class */
export const filenameMatchesToMap =
  (registry: RegistryAccess) =>
  (projectPath: string) =>
  async ({ added, deleted }: AddedAndDeletedFilenames): Promise<StringMapsForMatches> => {
    const resolver = new MetadataResolver(
      registry,
      VirtualTreeContainer.fromFilePaths(uniqueArrayConcat(added, deleted)),
    );

    localRepo = GitRepo.getInstance({
      dir: projectPath,
      registry,
    });

    return compareHashes(
      await buildMaps(
        addTypes(resolver)(
          await toFileInfo({
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
  added,
  deleted,
}: {
  added: Set<string>;
  deleted: Set<string>;
}): Promise<AddAndDeleteFileInfos> => {
  const headRef = (await localRepo.resolveRef('HEAD')) as string;
  const [addedInfo, deletedInfo] = await Promise.all([
    Promise.all(Array.from(added).map(getHashForAddedFile)),
    Promise.all(Array.from(deleted).map(getHashFromActualFileContents(headRef))),
  ]);

  return { addedInfo, deletedInfo };
};

const getHashForAddedFile = async (filepath: string): Promise<DetectionFileInfo> => {
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

const resolveType =
  (resolver: MetadataResolver) =>
  (filenames: string[]): SourceComponent[] =>
    filenames
      .flatMap((filename) => {
        try {
          return resolver.getComponentsFromPath(filename);
        } catch {
          return undefined;
        }
      })
      .filter(isDefined);

/** where we don't have git objects to use, read the file contents to generate the hash */
const getHashFromActualFileContents =
  (oid: string) =>
  async (filepath: string): Promise<DetectionFileInfo> => ({
    filename: filepath,
    basename: path.basename(filepath),
    hash: await localRepo.readOid(filepath, oid),
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
