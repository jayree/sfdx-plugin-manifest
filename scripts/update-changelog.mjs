#!/usr/bin/env node

import fs from 'fs';
import fetch from 'node-fetch';
import semver from 'semver';
import packageJson from 'package-json';

const changelogPath = './CHANGELOG.md';
const GITHUB_TOKEN = process.env.SVC_CLI_BOT_GITHUB_TOKEN || null;
const updateAll = process.argv.includes('--all');

// Repository where the pull requests were created
const CHANGELOG_REPO = { owner: 'jayree', repo: 'sfdx-plugin-manifest' };

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'release-injector',
  ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
};

// Normalize version strings using semver; returns null if invalid.
function normalizeVersion(version) {
  return semver.valid(version) || (semver.coerce(version) || {}).version || null;
}

// Log current API rate limits.
async function logApiLimits() {
  try {
    const res = await fetch('https://api.github.com/rate_limit', { headers });
    if (!res.ok) throw new Error(`Error fetching API limits: ${res.status}`);
    const { rate } = await res.json();
    console.log(
      `⚠️  API Rate Limits: Total: ${rate.limit}, Remaining: ${rate.remaining}, Resets at: ${new Date(
        rate.reset * 1000,
      ).toLocaleString()}`,
    );
  } catch (error) {
    console.warn(`⚠️  Error fetching API limits: ${error.message}`);
  }
}

// Extract PR number from a given line.
function extractPRNumber(line) {
  const match = line.match(/\[#(\d+)\]/);
  return match ? match[1] : null;
}

// Get the title of a pull request.
async function getPullRequestTitle(owner, repo, prNumber) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch PR #${prNumber}`);
  return (await res.json()).title;
}

// Resolve the GitHub repository for a given NPM package.
async function getRepoInfo(packageName) {
  const pkg = await packageJson(packageName, { fullMetadata: true });
  const repoUrl = pkg.repository?.url;
  if (!repoUrl || !repoUrl.includes('github.com')) throw new Error(`No GitHub repo for ${packageName}`);
  const match = repoUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
  if (!match) throw new Error(`Invalid repo URL: ${repoUrl}`);
  return { owner: match[1], repo: match[2] };
}

// Fetch all tags for a repository (paginated).
async function getAllTags(owner, repo) {
  const tags = [];
  for (let page = 1, perPage = 100; ; page++) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/tags?per_page=${perPage}&page=${page}`, {
      headers,
    });
    if (!res.ok) throw new Error(`Failed to fetch tags for ${repo} (page ${page})`);
    const pageTags = await res.json();
    if (!pageTags.length) break;
    tags.push(...pageTags.map((t) => t.name));
  }
  return tags;
}

// Parse release notes sections from text.
function parseReleaseSections(text = '') {
  const sections = { features: [], fixes: [], other: [] };
  let current = 'other';
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    // Skip release header lines.
    if (/^#{1,3} \[?\d+\.\d+\.\d+\]?.*?\(.*?\)/.test(trimmed)) continue;
    const lower = trimmed.toLowerCase();
    if (lower.includes('### features')) {
      current = 'features';
      continue;
    }
    if (lower.includes('### bug') || lower.includes('### fix')) {
      current = 'fixes';
      continue;
    }
    if (trimmed) sections[current].push(trimmed);
  }
  return sections;
}

// Fetch and group release notes between two version numbers.
async function getGroupedReleaseNotes(owner, repo, from, to) {
  const rawTags = await getAllTags(owner, repo);
  // Build objects containing both the original tag and a normalized version.
  const tagObjects = rawTags
    .map((tag) => {
      const versionStr = tag.startsWith('v') ? tag.slice(1) : tag;
      const normalized = semver.coerce(versionStr);
      return { original: tag, version: normalized ? normalized.version : null };
    })
    .filter((t) => t.version !== null);

  tagObjects.sort((a, b) => semver.compare(a.version, b.version));
  const rangeTags = tagObjects.filter((t) => semver.gt(t.version, from) && semver.lte(t.version, to));
  const grouped = { features: [], fixes: [], other: [] };

  await Promise.all(
    rangeTags.map(async (t) => {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${t.original}`, { headers });
      if (!res.ok) return;
      const release = await res.json();
      const parsed = parseReleaseSections(release.body || '');
      grouped.features.push(...parsed.features);
      grouped.fixes.push(...parsed.fixes);
      grouped.other.push(...parsed.other);
    }),
  );

  return grouped;
}

// Format grouped release notes as Markdown.
function formatGroupedAsMarkdown(grouped) {
  const format = (title, list) => (list.length ? `${list.map((l) => `  ${l}`).join('\n')}` : '');
  //   const format = (title, list) => (list.length ? `\n\n  #### ${title}\n${list.map((l) => `  ${l}`).join('\n')}` : '');
  return (
    format('🚀 Features', grouped.features) +
    (grouped.features.length && grouped.fixes.length ? '\n' : '') +
    format('🐛 Bug Fixes', grouped.fixes) +
    (grouped.fixes.length && grouped.other.length ? '\n' : '') +
    format('📄 Other Changes', grouped.other)
  );
}

// Process a dependency bump line and extract package and version info.
async function processDependencyBump(line) {
  const depsPatternFull = /^\* \*\*deps:\*\* bump ([\w@/.\-]+) from ([^\s]+) to ([^\s]+).*$/;
  const depsPatternPartial = /^\* \*\*deps:\*\* bump ([\w@/.\-]+).*$/;

  const matchFull = line.match(depsPatternFull);
  if (matchFull) {
    if (matchFull.length < 4) {
      console.warn(`⚠️ Full pattern match did not capture all groups: ${matchFull}`);
      return null;
    }
    const [, pkg, fromVersion, toVersion] = matchFull;
    return { pkg, fromVersion, toVersion };
  }

  const matchPartial = line.match(depsPatternPartial);
  if (matchPartial) {
    if (matchPartial.length < 2) {
      console.warn(`⚠️ Partial pattern match did not capture package: ${matchPartial}`);
      return null;
    }
    const pkg = matchPartial[1];
    console.warn(`🔍 Partial match for ${pkg}`);
    const prNumber = extractPRNumber(line);
    if (!prNumber) {
      console.warn(`⚠️ No PR number for ${pkg}`);
      return null;
    }
    const { owner: prOwner, repo: prRepo } = CHANGELOG_REPO;
    const prTitle = await getPullRequestTitle(prOwner, prRepo, prNumber);
    const versionMatch = prTitle.match(/bump .* from ([^\s]+) to ([^\s]+)/i);
    if (!versionMatch || versionMatch.length < 3) {
      console.warn(`⚠️ No version info in PR title for ${pkg}`);
      return null;
    }
    const [, fromVersion, toVersion] = versionMatch;
    return { pkg, fromVersion, toVersion };
  }
  return null;
}

// Get the indices (start and end) for the latest release entry in the changelog.
function getLatestEntryIndices(lines) {
  const releaseHeaderRegex = /^#{1,3} \[?\d+\.\d+\.\d+\]?.*?\(.*?\)/;
  let start = -1,
    end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (releaseHeaderRegex.test(lines[i])) {
      if (start === -1) start = i;
      else {
        end = i;
        break;
      }
    }
  }
  return { start: start === -1 ? 0 : start, end };
}

export async function preCommit(props) {
  await logApiLimits();
  const content = fs.readFileSync(changelogPath, 'utf-8');
  const lines = content.split('\n');
  const { start: latestStart, end: latestEnd } = getLatestEntryIndices(lines);
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);

    // If not updating all, process only dependency bumps within the latest entry.
    if (!updateAll && (i < latestStart || i >= latestEnd)) continue;

    const bump = await processDependencyBump(line);
    if (!bump) continue;
    const { pkg, fromVersion, toVersion } = bump;
    const normalizedFrom = normalizeVersion(fromVersion);
    const normalizedTo = normalizeVersion(toVersion);
    if (!normalizedFrom || !normalizedTo) {
      console.warn(`⚠️ Invalid versions for ${pkg}: ${fromVersion} → ${toVersion}`);
      continue;
    }
    try {
      const { owner, repo } = await getRepoInfo(pkg);
      const grouped = await getGroupedReleaseNotes(owner, repo, normalizedFrom, normalizedTo);
      const markdown = formatGroupedAsMarkdown(grouped);
      if (markdown.trim()) {
        newLines.push(markdown);
        console.log(`✅ Inserted notes for ${pkg}: ${normalizedFrom} → ${normalizedTo}`);
      } else {
        console.log(`📭 No notes found for ${pkg}: ${normalizedFrom} → ${normalizedTo}`);
      }
    } catch (err) {
      console.warn(`⚠️  Skipped ${pkg}: ${err.message}`);
    }
  }
  // Optionally, write the updated changelog back to the file:
  fs.writeFileSync(changelogPath, newLines.join('\n'), 'utf-8');
  console.log('✅ CHANGELOG.md updated');
}

preCommit().catch((error) => {
  console.error(`❌ Unhandled error: ${error}`);
  process.exit(1);
});
