# Release hooks

`release-version.mjs` exports the Conventional Changelog Action's
`preVersionGeneration` hook. It raises the proposed plugin version when an SDR
upgrade requires a larger release. The Action then writes that returned version
to `package.json` and uses it for its tag, changelog, commit and outputs. The hook
does not write files or rename an already generated tag.

`release-changelog.mjs` exports `preCommit` and delegates dependency release-note
enrichment to `update-changelog.mjs`. Prereleases skip this step because the
workflow does not generate a changelog file for them. Stable releases validate
their heading before enrichment, protecting historical entries from accidental
updates.

The standalone utility uses the same enrichment code:

```sh
node scripts/update-changelog/ucl.mjs
node scripts/update-changelog/ucl.mjs --all
```

The build has its own private package and lockfile so the plugin's dependency
tree does not determine which versions are bundled into the release hooks:

```sh
yarn --cwd scripts/update-changelog install --frozen-lockfile
yarn build-changelog-update
yarn check-changelog-build
yarn test:release-hooks
```

Commit both bundles after source or build-dependency changes. CI checks that a
fresh build matches the checked-in bundles. Tests execute these bundles in
temporary Git repositories and mock external API requests.

When changing the release workflow, also regenerate
`scripts/upstream-sync/patches/salesforce-release-workflow.patch` against the
stored upstream snapshot. A regression test verifies that the patch recreates
the complete customized workflow.
