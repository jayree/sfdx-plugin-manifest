# @jayree/sfdx-plugin-manifest

A Salesforce CLI plugin containing commands for creating manifest files from Salesforce orgs or git commits of sfdx projects.

[![sf](https://img.shields.io/badge/cli-sf-brightgreen.svg)](https://developer.salesforce.com/tools/salesforcecli)
[![NPM](https://img.shields.io/npm/v/@jayree/sfdx-plugin-manifest.svg?label=@jayree/sfdx-plugin-manifest)](https://npmjs.org/package/@jayree/sfdx-plugin-manifest)
[![Downloads/week](https://img.shields.io/npm/dw/@jayree/sfdx-plugin-manifest.svg)](https://npmjs.org/package/@jayree/sfdx-plugin-manifest)
[![License](https://img.shields.io/npm/l/@jayree/sfdx-plugin-manifest.svg)](https://github.com/jayree-plugins/sfdx-plugin-manifest/blob/main/package.json)

## Install

```bash
sf plugins:install @jayree/sfdx-plugin-manifest
```

> **Note:**
>
> The `jayree manifest git diff` command uses the `isomorphic-git` module, which does not support system or global git configurations. Windows users who have `autocrlf` enabled need to set this configuration locally in the repository to enhance the performance of the command.
>
> To do this, execute the following command in your repository:
>
> ```powershell
> git config --local core.autocrlf true
> ```




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

_See code: [src/commands/jayree/manifest/cleanup.ts](https://github.com/jayree/sfdx-plugin-manifest/blob/3.2.23/src/commands/jayree/manifest/cleanup.ts)_

### `sf jayree manifest generate`

Generate a complete manifest file form the specified org.

```
USAGE
  $ sf jayree manifest generate -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-q <value>] [-c] [-w]
    [--include-flow-versions] [-f <value>] [--exclude-managed | --exclude-all]

FLAGS
  -c, --match-case               Enable 'match case' for the quickfilter.
  -f, --file=<value>             Write to 'file' instead of stdout.
  -o, --target-org=<value>       (required) Username or alias of the target org. Not required if the `target-org`
                                 configuration variable is already set.
  -q, --quick-filter=<value>...  Metadata type, member or file path to filter on.
  -w, --match-whole-word         Enable 'match whole word' for the quickfilter.
      --api-version=<value>      Override the api version used for api requests made by this command
      --exclude-all              Exclude all packages from output.
      --exclude-managed          Exclude managed packages from output.
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

_See code: [src/commands/jayree/manifest/generate.ts](https://github.com/jayree/sfdx-plugin-manifest/blob/3.2.23/src/commands/jayree/manifest/generate.ts)_

### `sf jayree manifest git diff REF1 [REF2]`

Create a project manifest and destructiveChanges manifest that lists the metadata components you want to deploy or delete based on changes in your git history.

```
USAGE
  $ sf jayree manifest git diff REF1 [REF2] [--json] [--flags-dir <value>] [--api-version <value>] [-d <value>] [--output-dir
    <value>] [--destructive-changes-only]

ARGUMENTS
  REF1  Base commit or branch.
  REF2  Commit or branch to compare to the base commit.

FLAGS
  -d, --source-dir=<value>...     Path to the local source files to include in the manifest.
      --api-version=<value>       Override the api version used for api requests made by this command
      --destructive-changes-only  Create a destructiveChanges manifest only.
      --output-dir=<value>        Directory to save the created manifest files.

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

  --destructive-changes-only  Create a destructiveChanges manifest only.

    Use this flag to create a 'destructiveChanges.xml' and a blank 'package.xml'.

  --output-dir=<value>  Directory to save the created manifest files.

    The location can be an absolute path or relative to the current working directory.
```

_See code: [src/commands/jayree/manifest/git/diff.ts](https://github.com/jayree/sfdx-plugin-manifest/blob/3.2.23/src/commands/jayree/manifest/git/diff.ts)_
<!-- commandsstop -->
