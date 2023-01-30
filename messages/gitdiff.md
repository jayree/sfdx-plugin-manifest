# summary

Create a project manifest and destructiveChanges manifest that lists the metadata components you want to deploy or delete based on changes in your git history.

# description

Use this command to create a manifest and destructiveChanges manifest file based on the difference (git diff) of two git refs.

You can use all ways to spell <commit> which are valid for 'git diff' (See https://git-scm.com/docs/git-diff).

# examples

- Uses the changes between two arbitrary <commit>.

  <%= config.bin %> <%= command.id %> <commit> <commit>

  <%= config.bin %> <%= command.id %> <commit>..<commit>

- Uses the changes on the branch containing and up to the second <commit>, starting at a common ancestor of both <commit>.

  <%= config.bin %> <%= command.id %> <commit>...<commit>

- Uses the diff of what is unique in branchB (REF2) and unique in branchA (REF1).

  <%= config.bin %> <%= command.id %> branchA..branchB

- Uses the diff of what is unique in branchB (REF2).

  <%= config.bin %> <%= command.id %> branchA...branchB

- Specify the flags before or after the REF args

  <%= config.bin %> <%= command.id %> --output-dir package <commit> <commit> 

  <%= config.bin %> <%= command.id %> <commit> <commit> --output-dir package

- If you specify the 'source-dir' flag before the REF args, use '--' to separate the args from the 'source-dir' values.

  <%= config.bin %> <%= command.id %> --source-dir force-app -- <commit> <commit>

# args.ref1.description

Base commit or branch.

# args.ref2.description

Commit or branch to compare to the base commit.

# flags.output-dir.summary

Directory to save the created manifest files.

# flags.output-dir.description

The location can be an absolute path or relative to the current working directory.

# flags.source-dir.summary

Path to the local source files to include in the manifest.

# flags.source-dir.description

The supplied path can be to a single file (in which case the operation is applied to only one file) or to a folder (in which case the operation is applied to all metadata types in the directory and its subdirectories).

You can specify this flag more than once.

# flags.destructive-changes-only.summary

Create a destructiveChanges manifest only.

# flags.destructive-changes-only.description

Use this flag to create a 'destructiveChanges.xml' and a blank 'package.xml'.

# success

Successfully wrote %s.

# successOutputDir

Successfully wrote %s to %s.

# noComponents

No source-backed components present.
