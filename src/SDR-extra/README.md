# @jayree/sfdx-plugin-manifest

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

## Usage

> **Note:**
>
> The `jayree manifest git diff` command and the `SDR-extra` library use the `isomorphic-git` module, which does not support system-wide or global Git configurations. If you are a Windows user with `autocrlf` enabled, you must set this configuration locally within your repository to ensure optimal performance.
>
> To configure it, run the following command in your repository:
>
> ```powershell
> git config --local core.autocrlf true
> ```

### CLI Usage Examples

#### Generate Manifest Based on Changes Between Two Commits

```bash
sf jayree manifest git diff <commit> <commit>
sf jayree manifest git diff <commit>..<commit>
```

#### Generate Manifest Including Changes from a Common Ancestor

```bash
sf jayree manifest git diff <commit>...<commit>
```

#### Generate Manifest for Branch-Specific Diff Analysis

Unique changes in `branchB` relative to `branchA`:

```bash
sf jayree manifest git diff branchA..branchB
```

Unique changes only in `branchB`:

```bash
sf jayree manifest git diff branchA...branchB
```

#### Using Command Flags

Specify flags like `--output-dir` either before or after the commit arguments:

```bash
sf jayree manifest git diff --output-dir package <commit> <commit>
sf jayree manifest git diff <commit> <commit> --output-dir package
```

When using the `--source-dir` flag before the REF arguments, include `--` to clearly separate source directory values from commit references:

```bash
sf jayree manifest git diff --source-dir force-app -- <commit> <commit>
```

### Programmatic Usage

#### Initializing a Component Set from Git Commits

Leverage the library programmatically in your Node.js project:

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

## Use Cases

- **CI/CD Pipelines**: Automate metadata deployments with Git-based tracking.
- **Incremental Deployments**: Deploy only changes, saving time and reducing risks.
- **Metadata Management**: Handle complex scenarios like renamed files effectively.

## Additional Resources

- **[API Documentation](https://jayree.github.io/sfdx-plugin-manifest/)**
- **[Trailhead](https://trailhead.salesforce.com/)**
- **[GitHub Repository](https://github.com/jayree/sfdx-plugin-manifest)**

## License

This project is licensed under the BSD 3-Clause License. See the [LICENSE](https://opensource.org/licenses/BSD-3-Clause) file for details.

---

`@jayree/sfdx-plugin-manifest` simplifies metadata management, ensuring accurate and efficient deployments. Feedback and contributions are encouraged to improve the module.

