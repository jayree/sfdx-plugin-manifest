# SDR-extra 

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

## Introduction

SDR-extra is an extension for the JavaScript toolkit @salesforce/source-deploy-retrieve, aimed at enhancing the management of Salesforce metadata. It adds features that extend the Salesforce CLI deploy experience, particularly by addressing gaps and providing better support for incremental deployments based on changes tracked in your Git repository within the sf-project.

## Features

- Generate [manifest files](https://trailhead.salesforce.com/en/content/learn/modules/package-xml/package-xml-adventure) based on git commits of sf projects
- Exclude detected moved files within the Git project from the generated manifest files
- Create an isomorphic-git statusMatrix array based on two refs (instead of one)

## Usage

Install the package:

```
npm install @jayree/sfdx-plugin-manifest
```