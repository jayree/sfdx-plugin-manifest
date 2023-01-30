# summary

Removes those tags from a manifest file that are present in a second manifest file.

# description

Use this command to remove components or metadata types from a manifes file.

If the 'cleanup' manifest file (--file) doesn't exist, a template file is created, which can then be modified.

# examples

<%= config.bin %> <%= command.id %> --manifest=package.xml --file=packageignore.xml

# flags.manifest.summary

Path to the manifest file.

# flags.file.summary

Path to the second 'cleanup' manifest file.
