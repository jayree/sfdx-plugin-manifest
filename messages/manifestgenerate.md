# summary

Generate a complete manifest file form the specified org.

# description

Use this command to generate a manifest file based on an existing org.

# examples

<%= config.bin %> <%= command.id %> --targetusername myOrg@example.com

<?xml version='1.0' encoding='UTF-8'?>

<Package xmlns='http://soap.sforce.com/2006/04/metadata'>...</Package>

# flags.quick-filter.summary

Metadata type, member or file path to filter on.

# flags.match-case.summary

Enable 'match case' for the quickfilter.

# flags.match-whole-word.summary

Enable 'match whole word' for the quickfilter.

# flags.file.summary

Write to 'file' instead of stdout.

# flags.exclude-managed.summary

Exclude managed packages from output.

# flags.exclude-all.summary

Exclude all packages from output.

# flags.include-flow-versions.summary

Include flow versions as with api version 43.0.
