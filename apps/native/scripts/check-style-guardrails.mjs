#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const baselinePath = join(root, 'style-guardrails-baseline.json');
const updateBaseline = process.argv.includes('--update-baseline');

const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.json']);
const ignoredSegments = new Set(['.expo', '.turbo', 'node_modules', 'dist', 'build']);
const allowedRawStyleFiles = new Set([
  'app.json',
  'global.css',
  'theme/themes.ts',
  'theme/types.ts',
  'theme/utils.ts',
]);
const allowedGeneratedTokenImports = new Set(['theme/themes.ts']);
const allowedVazirmatnFiles = new Set(['app/_layout.tsx', 'theme/themes.ts', 'theme/types.ts']);
const allowedRadiusFiles = new Set(['theme/themes.ts', 'theme/types.ts']);

const rules = [
  {
    id: 'className',
    description: 'new className usage in apps/native',
    pattern: /\bclassName\s*=/,
  },
  {
    id: 'cn',
    description: 'new cn helper usage for native styles',
    pattern: /\bcn\s*\(/,
  },
  {
    id: 'cva',
    description: 'new CVA usage for native style variants',
    pattern: /\bcva\s*\(/,
  },
  {
    id: 'raw-color',
    description: 'raw hex/rgb/hsl colors outside token/theme files',
    pattern: /(?:#[0-9A-Fa-f]{3,8}\b|rgba?\(|hsla?\()/,
    isAllowed: (file) => allowedRawStyleFiles.has(file) || file.startsWith('theme/'),
  },
  {
    id: 'direct-saloora',
    description: 'direct saloora.* imports/usages in native components',
    pattern: /\bsaloora\./,
    isAllowed: (file) => file === 'lib/utils.ts' || file.startsWith('theme/'),
  },
  {
    id: 'generated-token-import',
    description: 'direct generated token imports in native components',
    pattern: /@repo\/brand-tokens\/generated\//,
    isAllowed: (file) => allowedGeneratedTokenImports.has(file),
  },
  {
    id: 'vazirmatn-family',
    description: 'hard-coded Vazirmatn family names outside theme/font loading',
    pattern: /Vazirmatn_[0-9A-Za-z]+/,
    isAllowed: (file) => allowedVazirmatnFiles.has(file) || file.startsWith('theme/'),
  },
  {
    id: 'ad-hoc-radius',
    description: 'ad hoc radius style keys outside tokens/theme',
    pattern: /\bborder(?:TopLeft|TopRight|BottomLeft|BottomRight)?Radius\s*:\s*\d+/,
    isAllowed: (file) => allowedRadiusFiles.has(file) || file.startsWith('theme/'),
  },
];

function extensionOf(file) {
  const match = file.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

function collectFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredSegments.has(entry.name)) continue;

    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(absolute));
      continue;
    }

    const relativePath = relative(root, absolute).split('\\').join('/');
    if (relativePath === 'style-guardrails-baseline.json') continue;
    if (sourceExtensions.has(extensionOf(entry.name))) files.push(absolute);
  }

  return files;
}

function findingKey(finding) {
  return `${finding.rule}|${finding.file}|${finding.line}|${finding.text}`;
}

function findViolations() {
  const findings = [];

  for (const absolute of collectFiles(root)) {
    const file = relative(root, absolute).split('\\').join('/');
    const lines = readFileSync(absolute, 'utf8').split(/\r?\n/);

    lines.forEach((lineText, index) => {
      const text = lineText.trim();
      if (!text) return;

      for (const rule of rules) {
        if (rule.isAllowed?.(file)) continue;
        if (!rule.pattern.test(lineText)) continue;

        findings.push({
          rule: rule.id,
          description: rule.description,
          file,
          line: index + 1,
          text,
        });
      }
    });
  }

  return findings.sort((a, b) => findingKey(a).localeCompare(findingKey(b)));
}

function loadBaseline() {
  if (!existsSync(baselinePath)) return [];
  const parsed = JSON.parse(readFileSync(baselinePath, 'utf8'));
  return Array.isArray(parsed.findings) ? parsed.findings : [];
}

const findings = findViolations();

if (updateBaseline) {
  writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        description:
          'Known native style guardrail findings. Run pnpm --filter @repo/native style:check -- --update-baseline only when intentionally accepting existing debt.',
        findings,
      },
      null,
      2
    )}\n`
  );
  console.log(`Updated native style guardrail baseline with ${findings.length} findings.`);
  process.exit(0);
}

const baseline = loadBaseline();
const baselineKeys = new Set(baseline.map(findingKey));
const findingKeys = new Set(findings.map(findingKey));
const newFindings = findings.filter((finding) => !baselineKeys.has(findingKey(finding)));
const resolvedFindings = baseline.filter((finding) => !findingKeys.has(findingKey(finding)));

if (newFindings.length === 0 && resolvedFindings.length === 0) {
  console.log(`Native style guardrails passed (${findings.length} baseline findings tracked).`);
  process.exit(0);
}

if (newFindings.length > 0) {
  console.error('\nNew native style guardrail findings:');
  for (const finding of newFindings) {
    console.error(
      `- [${finding.rule}] ${finding.file}:${finding.line} ${finding.description}\n  ${finding.text}`
    );
  }
}

if (resolvedFindings.length > 0) {
  console.error('\nResolved baseline findings detected. Refresh the baseline to keep it honest:');
  for (const finding of resolvedFindings) {
    console.error(`- [${finding.rule}] ${finding.file}:${finding.line}`);
  }
}

process.exit(1);
