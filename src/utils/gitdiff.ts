/*
 * Copyright (c) 2021, jayree
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join, basename, sep, posix, dirname } from 'path';
import * as fs from 'fs-extra';
import * as equal from 'fast-deep-equal';
import {
  ComponentSet,
  RegistryAccess,
  registry,
  VirtualDirectory,
  VirtualTreeContainer,
  SourceComponent,
  NodeFSTreeContainer as FSTreeContainer,
  MetadataResolver,
  DestructiveChangesType,
} from '@salesforce/source-deploy-retrieve';
import { parseMetadataXml } from '@salesforce/source-deploy-retrieve/lib/src/utils';
import { debug as Debug } from 'debug';
import git from 'isomorphic-git';

export const NodeFSTreeContainer = FSTreeContainer;

export const debug = Debug('jayree:manifest:git:diff');

const registryAccess = new RegistryAccess();

export interface Ctx {
  projectRoot: string;
  sfdxProjectFolders: string[];
  sourceApiVersion: string;
  gitLines: Array<{ path: string; status: string }>;
  gitResults: {
    manifest: ComponentSet;
    destructiveChanges: ComponentSet;
    unchanged: string[];
    ignored: { ref1: string[]; ref2: string[] };
    counts: { added: number; deleted: number; modified: number; unchanged: number; ignored: number; error: number };
    errors: string[];
  };
  ref1VirtualTreeContainer: VirtualTreeContainer;
  ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer;
  destructiveChangesComponentSet: ComponentSet;
  manifestComponentSet: ComponentSet;
  git: {
    ref1: string;
    ref2: string;
    ref1ref2: string;
  };
  destructiveChanges: {
    files: string[];
  };
  manifest: {
    file: string;
  };
}

export function ensureOSPath(path: string): string {
  return path.split(posix.sep).join(sep);
}

export function ensureGitPath(path: string): string {
  return path.split(sep).join(posix.sep);
}

export async function createVirtualTreeContainer(
  ref: string,
  dir: string,
  modifiedFiles: string[]
): Promise<VirtualTreeContainer> {
  const paths = (await git.listFiles({ fs, dir, ref })).map((p) => ensureOSPath(p));
  const oid = await git.resolveRef({ fs, dir, ref });
  debug({ modifiedFiles });
  const virtualDirectoryByFullPath = new Map<string, VirtualDirectory>();
  for (const filename of paths) {
    let dirPath = dirname(filename);
    virtualDirectoryByFullPath.set(dirPath, {
      dirPath,
      children: Array.from(
        new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add({
          name: basename(filename),
          data:
            parseMetadataXml(filename) && modifiedFiles.includes(filename)
              ? Buffer.from((await git.readBlob({ fs, dir, oid, filepath: ensureGitPath(filename) })).blob)
              : Buffer.from(''),
        })
      ),
    });
    const splits = filename.split(sep);
    for (let i = 0; i < splits.length - 2; i++) {
      dirPath = splits.slice(0, i + 1).join(sep);
      virtualDirectoryByFullPath.set(dirPath, {
        dirPath,
        children: Array.from(new Set(virtualDirectoryByFullPath.get(dirPath)?.children ?? []).add(splits[i + 1])),
      });
    }
  }
  return new VirtualTreeContainer(Array.from(virtualDirectoryByFullPath.values()));
}

export async function analyzeFile(
  path: string,
  ref1VirtualTreeContainer: VirtualTreeContainer,
  ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer
): Promise<{
  status: number;
  toManifest?: SourceComponent[];
  toDestructiveChanges?: SourceComponent[];
}> {
  if (!parseMetadataXml(path)) {
    return { status: 0 };
  }

  const ref2resolver = new MetadataResolver(registryAccess, ref2VirtualTreeContainer);
  const [ref2Component] = ref2resolver.getComponentsFromPath(path); // git path only conaints files

  const ref1resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
  const [ref1Component] = ref1resolver.getComponentsFromPath(path); // git path only conaints files

  if (equal(await ref1Component.parseXml(), await ref2Component.parseXml())) {
    return { status: -1 };
  }

  if (ref1Component.type.strictDirectoryName === true || !ref1Component.type.children) {
    return { status: 0 };
  }

  const SourceComponentNotInSource = ref1Component.getChildren().filter(
    (x) =>
      !ref2Component
        .getChildren()
        .map((f) => {
          return getUniqueIdentifier(f);
        })
        .includes(getUniqueIdentifier(x))
  ); // deleted
  const SourceComponentNotInTarget = ref2Component.getChildren().filter(
    (x) =>
      !ref1Component
        .getChildren()
        .map((f) => {
          return getUniqueIdentifier(f);
        })
        .includes(getUniqueIdentifier(x))
  ); // added
  const SourceComponentInSourceAndTarget = ref1Component.getChildren().filter((x) =>
    ref2Component
      .getChildren()
      .map((f) => {
        return getUniqueIdentifier(f);
      })
      .includes(getUniqueIdentifier(x))
  ); // modified?

  debug({ SourceComponentNotInSource, SourceComponentNotInTarget, SourceComponentInSourceAndTarget });

  for (const x of SourceComponentInSourceAndTarget) {
    const [y] = ref2Component.getChildren().filter((f) => getUniqueIdentifier(x) === getUniqueIdentifier(f));
    if (!equal(await x.parseXml(), await y.parseXml())) {
      SourceComponentNotInTarget.push(y); // modified! -> add to added
    }
  }

  debug({ SourceComponentNotInTarget });

  return {
    status: SourceComponentNotInSource.length + SourceComponentNotInTarget.length,
    toManifest: SourceComponentNotInTarget,
    toDestructiveChanges: SourceComponentNotInSource,
  };
}

function getUniqueIdentifier(component: SourceComponent): string {
  return `${component.type.name}#${component[component.type.uniqueIdElement] as string}`;
}

async function getFileStateChanges(
  commitHash1: string,
  commitHash2: string,
  dir: string
): Promise<
  [
    {
      path: string;
      status: string;
    }
  ]
> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return git.walk({
    fs,
    dir,
    trees: [git.TREE({ ref: commitHash1 }), commitHash2 ? git.TREE({ ref: commitHash2 }) : git.STAGE()],
    async map(filepath, [A, B]) {
      if (filepath === '.' || (await A?.type()) === 'tree' || (await B?.type()) === 'tree') {
        return;
      }

      const Aoid = await A?.oid();
      const Boid = await B?.oid();

      let type = 'EQ';
      if (Aoid !== Boid) {
        type = 'M';
      }
      if (Aoid === undefined) {
        type = 'A';
      }
      if (Boid === undefined) {
        type = 'D';
      }

      if (type !== 'EQ') {
        return {
          path: filepath,
          status: type,
        };
      }
    },
  });
}

export async function getGitDiff(
  sfdxProjectFolders: string[],
  ref1: string,
  ref2: string,
  dir: string
): Promise<Ctx['gitLines']> {
  let gitLines = (await getFileStateChanges(ref1, ref2, dir))
    .map((line) => {
      return { path: ensureOSPath(line.path), status: line.status };
    })
    .filter((l) =>
      sfdxProjectFolders.some((f) => {
        return l.path.startsWith(f);
      })
    );

  const renames = [];
  gitLines = gitLines.filter((line) => {
    if (line.status === 'D') {
      for (const sfdxFolder of sfdxProjectFolders) {
        const defaultFolder = join(sfdxFolder, 'main', 'default');
        const filePath = line.path.replace(line.path.startsWith(defaultFolder) ? defaultFolder : sfdxFolder, '');
        const target = gitLines.find((t) => t.path.endsWith(filePath) && t.status === 'A');
        if (target) {
          renames.push({ from: line.path, to: target.path });
          return false;
        }
      }
    }
    return true;
  });
  debug({ gitLines, renames, sfdxProjectFolders });
  return gitLines;
}

export async function getGitResults(
  gitLines: Ctx['gitLines'],
  ref1VirtualTreeContainer: VirtualTreeContainer,
  ref2VirtualTreeContainer: VirtualTreeContainer | FSTreeContainer
): Promise<Ctx['gitResults']> {
  const results = {
    manifest: new ComponentSet(undefined, registryAccess),
    destructiveChanges: new ComponentSet(undefined, registryAccess),
    unchanged: [],
    ignored: { ref1: [], ref2: [] },
    counts: { added: 0, deleted: 0, modified: 0, unchanged: 0, ignored: 0, error: 0 },
    errors: [],
  };
  const ref1Resolver = new MetadataResolver(registryAccess, ref1VirtualTreeContainer);
  const ref2Resolver = new MetadataResolver(registryAccess, ref2VirtualTreeContainer);

  for (const [, { status, path }] of gitLines.entries()) {
    if (status === 'D') {
      for (const c of ref1Resolver.getComponentsFromPath(path)) {
        if (c.xml === path || gitLines.find((x) => x.path === c.xml)) {
          results.destructiveChanges.add(c, DestructiveChangesType.POST);
          results.counts.deleted++;
        } else {
          try {
            ref2Resolver.getComponentsFromPath(c.xml);
            results.manifest.add(c);
            results.counts.added++;
          } catch (error) {
            results.counts.error++;
            results.errors.push(error);
          }
        }
      }
    } else if (status === 'A') {
      for (const c of ref2Resolver.getComponentsFromPath(path)) {
        results.manifest.add(c);
        results.counts.added++;
      }
    } else {
      const check = await analyzeFile(path, ref1VirtualTreeContainer, ref2VirtualTreeContainer);
      if (check.status === 0) {
        for (const c of ref2Resolver.getComponentsFromPath(path)) {
          results.manifest.add(c);
          results.counts.added++;
        }
      } else if (check.status === -1) {
        results.unchanged.push(path);
        results.counts.unchanged++;
      } else {
        results.counts.modified++;
        for (const c of check.toDestructiveChanges) {
          results.destructiveChanges.add(c, DestructiveChangesType.POST);
        }
        for (const c of check.toManifest) {
          results.manifest.add(c);
        }
      }
    }
  }

  results.ignored = {
    ref1: Array.from(ref1Resolver.forceIgnoredPaths),
    ref2: Array.from(ref2Resolver.forceIgnoredPaths),
  };
  results.counts.ignored = ref1Resolver.forceIgnoredPaths.size + ref2Resolver.forceIgnoredPaths.size;

  return results;
}

export function buildManifestComponentSet(cs: ComponentSet, forDestructiveChanges = false): ComponentSet {
  let csArray = cs.toArray();
  // SDR library is more strict and avoids fixes like this
  if (!forDestructiveChanges) {
    const childsTobeReplacedByParent = [
      ...Object.keys(registry.types.workflow.children.types),
      ...Object.keys(registry.types.sharingrules.children.types),
    ];
    csArray = csArray.map((component) => {
      if (childsTobeReplacedByParent.includes(component.type.id)) {
        return component.parent;
      }
      return component;
    });
  }

  return new ComponentSet(
    csArray.sort((a, b) => {
      if (a.type.name === b.type.name) {
        return a.fullName.toLowerCase() > b.fullName.toLowerCase() ? 1 : -1;
      }
      return a.type.name.toLowerCase() > b.type.name.toLowerCase() ? 1 : -1;
    }),
    registryAccess
  );
}
