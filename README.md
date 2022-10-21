# @jayree/sfdx-plugin-manifest

A Salesforce CLI plugin containing commands for creating manifest files from Salesforce orgs or git commits of sfdx projects.

[![sfdx](https://img.shields.io/badge/cli-sfdx-brightgreen.svg)](https://developer.salesforce.com/tools/sfdxcli)
[![Version](https://img.shields.io/npm/v/@jayree/sfdx-plugin-manifest.svg)](https://npmjs.org/package/@jayree/sfdx-plugin-manifest)
[![test-and-release](https://github.com/jayree/sfdx-plugin-manifest/actions/workflows/release.yml/badge.svg)](https://github.com/jayree/sfdx-plugin-manifest/actions/workflows/release.yml)
[![Downloads/week](https://img.shields.io/npm/dw/@jayree/sfdx-plugin-manifest.svg)](https://npmjs.org/package/@jayree/sfdx-plugin-manifest)
[![License](https://img.shields.io/npm/l/@jayree/sfdx-plugin-manifest.svg)](https://github.com/jayree-plugins/sfdx-plugin-manifest/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
<!-- install -->

## Usage

<!-- usage -->
```sh-session
$ sfdx plugins:install @jayree/sfdx-plugin-manifest
$ sfdx jayree:[COMMAND]
running command...
$ sfdx plugins
@jayree/sfdx-plugin-manifest 2.3.8
$ sfdx help jayree:[COMMAND]
USAGE
  $ sfdx jayree:COMMAND
...
```
<!-- usagestop -->

## Commands

<!-- commands -->
* [`sfdx jayree:manifest:cleanup`](#sfdx-jayreemanifestcleanup)
* [`sfdx jayree:manifest:generate`](#sfdx-jayreemanifestgenerate)
* [`sfdx jayree:manifest:git:diff`](#sfdx-jayreemanifestgitdiff)

### `sfdx jayree:manifest:cleanup`

removes those tags from a manifest file that are present in a second manifest file

```
USAGE
  $ sfdx jayree:manifest:cleanup [-x <filepath>] [-f <filepath>] [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -f, --file=<value>                                                                path to the second 'cleanup'
                                                                                    manifest file
  -x, --manifest=<value>                                                            path to the manifest file
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  removes those tags from a manifest file that are present in a second manifest file
  Use this command to remove components or metadata types from a manifes file.
  If the 'cleanup' manifest file (--file) doesn't exist, a template file is created, which can then be modified.

EXAMPLES
  $ sfdx jayree:manifest:cleanup --manifest=package.xml --file=packageignore.xml
```

_See code: [src/commands/jayree/manifest/cleanup.ts](https://github.com/jayree/sfdx-plugin-manifest/blob/v2.3.8/src/commands/jayree/manifest/cleanup.ts)_

### `sfdx jayree:manifest:generate`

generate a complete manifest file form the specified org

```
USAGE
  $ sfdx jayree:manifest:generate [-q <array>] [-c] [-w] [--includeflowversions] [-f <string>] [-x | -a] [-u <string>]
    [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -a, --excludeall                                                                  exclude all packages from output
  -c, --matchcase                                                                   enable 'match case' for the
                                                                                    quickfilter
  -f, --file=<value>                                                                write to 'file' instead of stdout
  -q, --quickfilter=<value>                                                         csv separated list of metadata type,
                                                                                    member or file names to filter on
  -u, --targetusername=<value>                                                      username or alias for the target
                                                                                    org; overrides default target org
  -w, --matchwholeword                                                              enable 'match whole word' for the
                                                                                    quickfilter
  -x, --excludemanaged                                                              exclude managed packages from output
  --apiversion=<value>                                                              override the api version used for
                                                                                    api requests made by this command
  --includeflowversions                                                             include flow versions as with api
                                                                                    version 43.0
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  generate a complete manifest file form the specified org
  Use this command to generate a manifest file based on an existing org.

EXAMPLES
  $ sfdx jayree:manifest:generate --targetusername myOrg@example.com

  <?xml version='1.0' encoding='UTF-8'?>

  <Package xmlns='http://soap.sforce.com/2006/04/metadata'>...</Package>
```

_See code: [src/commands/jayree/manifest/generate.ts](https://github.com/jayree/sfdx-plugin-manifest/blob/v2.3.8/src/commands/jayree/manifest/generate.ts)_

### `sfdx jayree:manifest:git:diff`

create a manifest and destructiveChanges manifest using 'git diff' data

```
USAGE
  $ sfdx jayree:manifest:git:diff [-o <string>] [-d] [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

ARGUMENTS
  REF1  base commit or branch
  REF2  commit or branch to compare to the base commit

FLAGS
  -d, --destructivechangesonly                                                      create a destructiveChanges manifest
                                                                                    only (package.xml will be empty)
  -o, --outputdir=<value>                                                           directory to save the created
                                                                                    manifest files
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  create a manifest and destructiveChanges manifest using 'git diff' data
  Use this command to create a manifest and destructiveChanges manifest file based on the difference (git diff) of two
  git refs.

  You can use all ways to spell <commit> which are valid for 'git diff'.
  (See https://git-scm.com/docs/git-diff)

EXAMPLES
  $ sfdx jayree:manifest:git:diff <commit> <commit>

  $ sfdx jayree:manifest:git:diff <commit>..<commit>

  uses the changes between two arbitrary <commit>

  $ sfdx jayree:manifest:git:diff <commit>...<commit>

  uses the changes on the branch containing and up to the second <commit>, starting at a common ancestor of both <commit>.

  $ sfdx jayree:manifest:git:diff branchA..branchB

  uses the diff of what is unique in branchB (REF2) and unique in branchA (REF1)

  $ sfdx jayree:manifest:git:diff branchA...branchB

  uses the diff of what is unique in branchB (REF2)
```

_See code: [src/commands/jayree/manifest/git/diff.ts](https://github.com/jayree/sfdx-plugin-manifest/blob/v2.3.8/src/commands/jayree/manifest/git/diff.ts)_
<!-- commandsstop -->
