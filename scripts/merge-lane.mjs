import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DAILY_FILE = /^content\/daily-news\/(\d{4}-\d{2}-\d{2})\.json$/;
const SITEMAP = 'public/sitemap.xml';
const STATUS = 'docs/STATUS.md';
const BRANCH_DATE = /^daily-news\/(\d{4}-\d{2}-\d{2})(?:-|$)/;

export function isRealDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function todayInLosAngeles(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function branchDate(branch) {
  const match = BRANCH_DATE.exec(branch);
  if (!match || !isRealDate(match[1])) return null;
  return match[1];
}

function fileList(files) {
  return [...new Set(files.map(file => file.trim()).filter(Boolean))].sort();
}

export function classifyMergeLane({ files, branch, today }) {
  const list = fileList(files);
  const dailyDates = list.flatMap(file => {
    const match = DAILY_FILE.exec(file);
    return match ? [match[1]] : [];
  });
  const onlyDailyShape = list.every(file => file === SITEMAP || DAILY_FILE.test(file));
  const date = dailyDates.length === 1 ? dailyDates[0] : null;
  const dateAllowed = date !== null
    && isRealDate(date)
    && (date === branchDate(branch) || date === today);

  if (onlyDailyShape && dateAllowed) {
    return { lane: 'tier-0', ok: true, files: list };
  }
  if (branch.startsWith('daily-news/')) {
    return { lane: 'fail', ok: false, files: list };
  }
  if (list.length === 1 && list[0] === STATUS) {
    return { lane: 'tier-0', ok: true, files: list };
  }
  return { lane: 'needs-josh', ok: true, files: list };
}

export function renderSummary(result) {
  const head = result.ok
    ? `lane: ${result.lane}`
    : 'fail: daily-news branch is outside the tier-0 allow-list';
  const lines = result.files.length
    ? result.files.map(file => `- ${file}`)
    : ['- (no changed files)'];
  return `${head}\n\nfiles:\n${lines.join('\n')}\n`;
}

export function statusDescription(result) {
  if (!result.ok) {
    return 'fail daily-news branch is outside the tier-0 allow-list';
  }
  const count = `${result.files.length} ${result.files.length === 1 ? 'file' : 'files'}`;
  const shown = result.files.slice(0, 2).join(' ');
  return `${result.lane} ${count} ${shown}`.trim().slice(0, 140);
}

function changedFiles(base, head) {
  const out = execFileSync('git', ['diff', '--name-only', `${base}...${head}`], {
    encoding: 'utf8',
  });
  return out.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
    return trimmed;
  });
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'sampa-merge-lane',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function postStatus({ repo, sha, token, result, targetUrl }) {
  const response = await fetch(`https://api.github.com/repos/${repo}/statuses/${sha}`, {
    method: 'POST',
    headers: githubHeaders(token),
    body: JSON.stringify({
      state: result.ok ? 'success' : 'failure',
      context: 'merge-lane',
      description: statusDescription(result),
      target_url: targetUrl,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`merge-lane status ${response.status}: ${body.slice(0, 300)}`);
  }
}

async function updateCheckRun({ repo, token, runId, result, summary }) {
  const response = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}/jobs`, {
    headers: githubHeaders(token),
  });
  if (!response.ok) return;
  const payload = await response.json();
  const job = (payload.jobs || []).find(item => item.name === 'merge-lane');
  if (!job?.check_run_url) return;
  const update = await fetch(job.check_run_url, {
    method: 'PATCH',
    headers: githubHeaders(token),
    body: JSON.stringify({
      output: {
        title: statusDescription(result),
        summary,
      },
    }),
  });
  if (!update.ok) {
    const body = await update.text();
    console.error(`merge-lane check output skipped: ${update.status} ${body.slice(0, 300)}`);
  }
}

async function main() {
  const base = process.env.MERGE_LANE_BASE || 'origin/main';
  const head = process.env.MERGE_LANE_HEAD || 'HEAD';
  const branch = process.env.GITHUB_HEAD_REF || process.env.MERGE_LANE_BRANCH || '';
  const today = process.env.MERGE_LANE_TODAY || todayInLosAngeles();
  const result = classifyMergeLane({
    files: changedFiles(base, head),
    branch,
    today,
  });
  const summary = renderSummary(result);
  process.stdout.write(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
  if (process.env.GITHUB_ACTIONS === 'true') {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.REPO || process.env.GITHUB_REPOSITORY;
    const sha = process.env.HEAD_SHA;
    if (!token || !repo || !sha) {
      throw new Error('merge-lane needs GITHUB_TOKEN, REPO, and HEAD_SHA');
    }
    await postStatus({
      repo,
      sha,
      token,
      result,
      targetUrl: process.env.RUN_URL,
    });
    try {
      await updateCheckRun({
        repo,
        token,
        runId: process.env.RUN_ID,
        result,
        summary,
      });
    } catch (error) {
      console.error(`merge-lane check output skipped: ${error.message}`);
    }
  }
  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
