# @jayree/sfdx-plugin-manifest

A Salesforce CLI plugin containing commands for creating manifest files from Salesforce orgs or git commits of sfdx projects.

[![sf](https://img.shields.io/badge/cli-sf-brightgreen.svg)](https://developer.salesforce.com/tools/salesforcecli)
[![NPM](https://img.shields.io/npm/v/@jayree/sfdx-plugin-manifest.svg?label=@jayree/sfdx-plugin-manifest)](https://npmjs.org/package/@jayree/sfdx-plugin-manifest)
[![Downloads/week](https://img.shields.io/npm/dw/@jayree/sfdx-plugin-manifest.svg)](https://npmjs.org/package/@jayree/sfdx-plugin-manifest)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/jayree/sfdx-plugin-manifest/main/LICENSE.txt)

## Introduction

`@jayree/sfdx-plugin-manifest` is a Salesforce CLI plugin and Node.js library designed to streamline metadata management and deployment processes. By leveraging Salesforce's native [@salesforce/source-deploy-retrieve](https://github.com/forcedotcom/source-deploy-retrieve) toolkit and [@salesforce/source-tracking](https://github.com/forcedotcom/source-tracking), it ensures compatibility with Salesforce standards. The plugin is particularly effective for incremental deployments and Git-based change tracking, making it a valuable tool for modern Salesforce development workflows.

## Key Features

- **Dual Integration**: Use it as a Salesforce CLI plugin or integrate it into Node.js applications for programmatic workflows.
- **Native Compatibility**: Built on `@salesforce/source-deploy-retrieve` and `@salesforce/source-tracking`, ensuring alignment with Salesforce's Metadata API standards. Unlike tools with custom metadata handling, this plugin leverages native frameworks for reliability.
- **Git-Enhanced Deployments**: Simplifies deployment processes by analyzing Git changes and generating precise manifests.
- **Automated Manifest Creation**: Automatically generate [package.xml](https://trailhead.salesforce.com/en/content/learn/modules/package-xml/package-xml-adventure) files for streamlined deployments.
- **Intelligent File Tracking**: Detects and excludes renamed or moved files for accurate metadata tracking.

## Why Use @jayree/sfdx-plugin-manifest?

Managing Salesforce metadata across teams and environments can be challenging. This plugin simplifies workflows by automating manifest creation and focusing on incremental deployments based on Git changes. It is ideal for:

- **Collaborative Development**: Streamlines workflows for teams sharing metadata repositories.
- **CI/CD Pipelines**: Ensures accurate and efficient deployments in automated pipelines.
- **Error Reduction**: Automates tasks prone to manual errors, like manifest creation.

## Comparison with sfdx-git-delta

Both `@jayree/sfdx-plugin-manifest` and `sfdx-git-delta` are tools designed to simplify Salesforce metadata deployments. However, their **technological basis** differs:

- `@jayree/sfdx-plugin-manifest` is built on Salesforce's native [@salesforce/source-deploy-retrieve](https://github.com/forcedotcom/source-deploy-retrieve), ensuring full compatibility with Salesforce Metadata API standards.
- `sfdx-git-delta` uses custom metadata handling mechanisms, which are not directly tied to Salesforce's native APIs and frameworks, potentially introducing additional complexity.

By prioritizing native compatibility and programmatic flexibility, `@jayree/sfdx-plugin-manifest` offers a reliable solution for modern Salesforce development. While both tools are specialized for CI/CD workflows, `sfdx-git-delta` provides additional support for a small number of specific edge use cases.

## Installation

> **Note:**
>
> The `jayree manifest git diff` command and the `SDR-extra` library use the `isomorphic-git` module, which does not support system-wide or global Git configurations. If you are a Windows user with `autocrlf` enabled, you must set this configuration locally within your repository to ensure optimal performance.
>
> To configure it, run the following command in your repository:
>
> ```powershell
> git config --local core.autocrlf true
> ```

### As a Salesforce CLI Plugin

Install the plugin using the Salesforce CLI:

```bash
sf plugins install @jayree/sfdx-plugin-manifest
```

### As a Node.js Module

Add the library to your Node.js project:

```bash
npm install @jayree/sfdx-plugin-manifest
```

Initialize a Component Set from Git Commits:

```typescript
import { ComponentSetExtra } from '@jayree/sfdx-plugin-manifest/lib/SDR-extra/index.js';

(async () => {
  const fromSingleCommit = await ComponentSetExtra.fromGitDiff(['HEAD~1']);
  const fromMultipleCommits = await ComponentSetExtra.fromGitDiff([
    'commit1',
    'HEAD'
  ]);
})();
```

## Commands

<!-- commands -->
* [`sf jayree manifest cleanup`](#sf-jayree-manifest-cleanup)
* [`sf jayree manifest generate`](#sf-jayree-manifest-generate)
* [`sf jayree manifest git diff REF1 [REF2]`](#sf-jayree-manifest-git-diff-ref1-ref2)

### `sf jayree manifest cleanup`

Removes those tags from a manifest file that are present in a second manifest file.

```
USAGE
  $ sf jayree manifest cleanup -f <value> [--json] [--flags-dir <value>] [-x <value>]

FLAGS
  -f, --file=<value>      (required) Path to the second 'cleanup' manifest file.
  -x, --manifest=<value>  Path to the manifest file.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Removes those tags from a manifest file that are present in a second manifest file.

  Use this command to remove components or metadata types from a manifes file.

  If the 'cleanup' manifest file (--file) doesn't exist, a template file is created, which can then be modified.

EXAMPLES
  $ sf jayree manifest cleanup --manifest=package.xml --file=packageignore.xml
```

_See code: [src/commands/jayree/manifest/cleanup.ts](https://github.com/jayree/sfdx-plugin-manifest/blob/3.6.49/src/commands/jayree/manifest/cleanup.ts)_

### `sf jayree manifest generate`

Generate a complete manifest file form the specified org.

```
USAGE
  $ sf jayree manifest generate -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-q <value>...] [-c] [-w]
    [--include-flow-versions] [-f <value>] [-x | -a]

FLAGS
  -a, --exclude-all              Exclude all packages from output.
  -c, --match-case               Enable 'match case' for the quickfilter.
  -f, --file=<value>             Write to 'file' instead of stdout.
  -o, --target-org=<value>       (required) Username or alias of the target org. Not required if the `target-org`
                                 configuration variable is already set.
  -q, --quick-filter=<value>...  Metadata type, member or file path to filter on.
  -w, --match-whole-word         Enable 'match whole word' for the quickfilter.
  -x, --exclude-managed          Exclude managed packages from output.
      --api-version=<value>      Override the api version used for api requests made by this command
      --include-flow-versions    Include flow versions as with api version 43.0.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate a complete manifest file form the specified org.

  Use this command to generate a manifest file based on an existing org.

EXAMPLES
  $ sf jayree manifest generate --targetusername myOrg@example.com
  <?xml version='1.0' encoding='UTF-8'?>
  <Package xmlns='http://soap.sforce.com/2006/04/metadata'>...</Package>
```

_See code: [src/commands/jayree/manifest/generate.ts](https://github.com/jayree/sfdx-plugin-manifest/blob/3.6.49/src/commands/jayree/manifest/generate.ts)_

### `sf jayree manifest git diff REF1 [REF2]`

Create a project manifest and destructiveChanges manifest that lists the metadata components you want to deploy or delete based on changes in your git history.

```
USAGE
  $ sf jayree manifest git diff REF1 [REF2] [--json] [--flags-dir <value>] [--api-version <value>] [-d <value>...] [-r
    <value>] [--destructive-changes-only]

ARGUMENTS
  REF1  Base commit or branch.
  REF2  Commit or branch to compare to the base commit.

FLAGS
  -d, --source-dir=<value>...     Path to the local source files to include in the manifest.
  -r, --output-dir=<value>        Directory to save the created manifest files.
      --api-version=<value>       Override the api version used for api requests made by this command
      --destructive-changes-only  Create a destructiveChanges manifest only.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Create a project manifest and destructiveChanges manifest that lists the metadata components you want to deploy or
  delete based on changes in your git history.

  Use this command to create a manifest and destructiveChanges manifest file based on the difference (git diff) of two
  git refs.

  You can use all ways to spell <commit> which are valid for 'git diff' (See https://git-scm.com/docs/git-diff).

ALIASES
  $ sf jayree manifest beta git diff

EXAMPLES
  Uses the changes between two arbitrary <commit>.

    $ sf jayree manifest git diff <commit> <commit>
    $ sf jayree manifest git diff <commit>..<commit>

  Uses the changes on the branch containing and up to the second <commit>, starting at a common ancestor of both
  <commit>.

    $ sf jayree manifest git diff <commit>...<commit>

  Uses the diff of what is unique in branchB (REF2) and unique in branchA (REF1).

    $ sf jayree manifest git diff branchA..branchB

  Uses the diff of what is unique in branchB (REF2).

    $ sf jayree manifest git diff branchA...branchB

  Specify the flags before or after the REF args

    $ sf jayree manifest git diff --output-dir package <commit> <commit>
    $ sf jayree manifest git diff <commit> <commit> --output-dir package

  If you specify the 'source-dir' flag before the REF args, use '--' to separate the args from the 'source-dir'
  values.

    $ sf jayree manifest git diff --source-dir force-app -- <commit> <commit>

FLAG DESCRIPTIONS
  -d, --source-dir=<value>...  Path to the local source files to include in the manifest.

    The supplied path can be to a single file (in which case the operation is applied to only one file) or to a folder
    (in which case the operation is applied to all metadata types in the directory and its subdirectories).

    You can specify this flag more than once.

  -r, --output-dir=<value>  Directory to save the created manifest files.

    The location can be an absolute path or relative to the current working directory.

  --destructive-changes-only  Create a destructiveChanges manifest only.

    Use this flag to create a 'destructiveChanges.xml' and a blank 'package.xml'.
```

_See code: [src/commands/jayree/manifest/git/diff.ts](https://github.com/jayree/sfdx-plugin-manifest/blob/3.6.49/src/commands/jayree/manifest/git/diff.ts)_
<!-- commandsstop -->

## Performance Testing

There are some benchmark.js checks to get a baseline for `jayree manifest git diff` command performance.

https://jayree.github.io/sfdx-plugin-manifest/perf-Linux/  
https://jayree.github.io/sfdx-plugin-manifest/perf-Windows/
