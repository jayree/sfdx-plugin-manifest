module.exports = {
  commandDescription: `create a manifest and destructiveChanges manifest using 'git diff' data
Use this command to create a manifest and destructiveChanges manifest file based on the difference (git diff) of two git refs.

You can use all ways to spell <commit> which are valid for 'git diff'.
(See https://git-scm.com/docs/git-diff)`,
  examples: [
    `$ sfdx jayree:manifest:git:diff <commit> <commit>
$ sfdx jayree:manifest:git:diff <commit>..<commit>
uses the changes between two arbitrary <commit>
`,
    `$ sfdx jayree:manifest:git:diff <commit>...<commit>
uses the changes on the branch containing and up to the second <commit>, starting at a common ancestor of both <commit>.
    `,
    `$ sfdx jayree:manifest:git:diff branchA..branchB
uses the diff of what is unique in branchB (REF2) and unique in branchA (REF1)
`,
    `$ sfdx jayree:manifest:git:diff branchA...branchB
uses the diff of what is unique in branchB (REF2)`,
  ],
  outputdir: 'directory to save the created manifest files',
  destructivechangesonly: 'create a destructiveChanges manifest only (package.xml will be empty)',
};
