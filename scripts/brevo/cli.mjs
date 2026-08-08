#!/usr/bin/env node
/**
 * SAMPA Brevo CLI — draft + test by default; mass send gated.
 *
 * Usage:
 *   node scripts/brevo/cli.mjs <command> [options]
 *   scripts/run-brevo.sh <command> [options]
 *
 * Commands:
 *   account
 *   lists [--folder-id N]
 *   setup-check
 *   campaign-draft --file path.json [--validate-only] [--dry-run]
 *   campaign-get --id N
 *   campaign-test --id N [--email a@x,b@y]
 *   campaign-send --id N --i-understand-send-to-production
 *   contact-upsert --email a@x [--fname N] [--lname N] [--lists announcements,weekly_news] [--attr KEY=VAL]
 *   import-csv-plan --file contacts.csv
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  brevo,
  die,
  printJson,
  resolveListIds,
  senderFromEnv,
  replyToFromEnv,
  LIST_ENV,
} from './lib.mjs';

const args = process.argv.slice(2);
const cmd = args[0];

function flag(name) {
  return args.includes(name);
}

function opt(name, fallback) {
  const i = args.indexOf(name);
  if (i === -1 || i + 1 >= args.length) return fallback;
  return args[i + 1];
}

function usage() {
  console.log(`SAMPA Brevo CLI

Commands:
  account                         GET /account (key smoke test)
  lists                           GET /contacts/lists
  setup-check                     Verify env sender + list id envs
  campaign-draft --file F.json    Create draft campaign from JSON
    --validate-only               Schema check only (no API)
    --dry-run                     Print payload, no POST
    --with-tag                    Include JSON tag (paid plans; free rejects tags)
  campaign-get --id N             GET campaign
  campaign-test --id N            POST sendTest
    --email a@x,b@y               Explicit test recipients (else Brevo test list)
  campaign-send --id N            POST sendNow (REQUIRES gate flag)
    --i-understand-send-to-production
  contact-upsert --email a@x      Create/update contact
    --fname --lname --lists k,k   --attr KEY=VAL (repeatable)
  import-csv-plan --file f.csv    Print Landing-A import guidance (no API)
  member-email-test --kind welcome|renewal|donation --email a@x
    --fname Name [--amount-cents 5000] [--frequency once|monthly]
                                  Send transactional email (always force; not a blast)

Campaign JSON shape:
{
  "name": "internal campaign name",
  "subject": "...",
  "previewText": "...",
  "htmlContent": "<html>...</html>",   // or htmlPath: "relative/to/repo.html"
  "listKeys": ["test"],                // logical keys → BREVO_LIST_* env
  "tag": "site-launch"
}

Env: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, BREVO_REPLY_TO,
     BREVO_LIST_ANNOUNCEMENTS|WEEKLY_NEWS|POLICY|JOBS|CME|TEST
`);
}

async function cmdAccount() {
  const data = await brevo('GET', '/account');
  printJson({
    ok: true,
    email: data.email,
    companyName: data.companyName,
    plan: data.plan,
    relay: data.relay,
  });
}

async function cmdLists() {
  const limit = Number(opt('--limit', '50'));
  const offset = Number(opt('--offset', '0'));
  const data = await brevo('GET', `/contacts/lists?limit=${limit}&offset=${offset}`);
  const lists = (data.lists || data || []).map((l) => ({
    id: l.id,
    name: l.name,
    totalSubscribers: l.totalSubscribers,
    folderId: l.folderId,
  }));
  printJson({ ok: true, count: data.count ?? lists.length, lists });
}

function cmdSetupCheck() {
  const sender = senderFromEnv();
  const replyTo = replyToFromEnv();
  const hasKey = !!(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY);
  const lists = {};
  for (const [key, envName] of Object.entries(LIST_ENV)) {
    lists[key] = process.env[envName] ? Number(process.env[envName]) : null;
  }
  const missingLists = Object.entries(lists)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  printJson({
    ok: hasKey && !!sender.email,
    hasApiKey: hasKey,
    sender,
    replyTo,
    listIds: lists,
    missingListEnv: missingLists,
    note: missingLists.length
      ? 'Create lists in Brevo, then set BREVO_LIST_* ids. campaign-draft to test can use numeric listIds in JSON instead.'
      : 'All list env ids present.',
  });
  if (!hasKey) process.exitCode = 2;
}

function loadCampaignSpec(filePath) {
  const abs = resolve(filePath);
  if (!existsSync(abs)) die(`File not found: ${abs}`);
  const spec = JSON.parse(readFileSync(abs, 'utf8'));
  if (spec.htmlPath && !spec.htmlContent) {
    const htmlAbs = resolve(abs, '..', spec.htmlPath);
    // allow path relative to json file or cwd
    const candidates = [
      resolve(process.cwd(), spec.htmlPath),
      resolve(abs, '..', spec.htmlPath),
      htmlAbs,
    ];
    const found = candidates.find((p) => existsSync(p));
    if (!found) die(`htmlPath not found: ${spec.htmlPath}`);
    spec.htmlContent = readFileSync(found, 'utf8');
  }
  return spec;
}

function validateCampaignSpec(spec) {
  const errors = [];
  if (!spec.name || String(spec.name).trim().length < 2) errors.push('name required');
  if (!spec.subject || String(spec.subject).trim().length < 2) errors.push('subject required');
  const html = spec.htmlContent || '';
  if (html.length < 10) errors.push('htmlContent or htmlPath required (≥10 chars HTML)');
  if (html.length > 900_000) errors.push('htmlContent too large (>~1MB)');
  const hasLists =
    (Array.isArray(spec.listKeys) && spec.listKeys.length) ||
    (Array.isArray(spec.listIds) && spec.listIds.length);
  if (!hasLists) errors.push('listKeys (logical) or listIds (numeric) required');
  return errors;
}

function buildCampaignPayload(spec) {
  const sender = {
    name: spec.senderName || senderFromEnv().name,
    email: spec.senderEmail || senderFromEnv().email,
  };
  let listIds = [];
  if (Array.isArray(spec.listIds) && spec.listIds.length) {
    listIds = spec.listIds.map(Number);
  } else {
    listIds = resolveListIds(spec.listKeys);
  }
  const payload = {
    name: spec.name,
    subject: spec.subject,
    sender,
    replyTo: spec.replyTo || replyToFromEnv(),
    htmlContent: spec.htmlContent,
    recipients: { listIds },
    inlineImageActivation: false,
    mirrorActive: true,
  };
  if (spec.previewText) payload.previewText = spec.previewText;
  // Free Brevo plan rejects campaign tags (405 method_not_allowed).
  // Only attach when caller opts in: --with-tag (paid plans).
  if (flag('--with-tag')) {
    if (spec.tag) payload.tag = spec.tag;
    if (Array.isArray(spec.tags)) payload.tag = spec.tags[0];
  }
  if (spec.scheduledAt) {
    // Optional: only if human put a schedule in the JSON on purpose
    payload.scheduledAt = spec.scheduledAt;
  }
  return payload;
}

async function cmdCampaignDraft() {
  const file = opt('--file');
  if (!file) die('campaign-draft requires --file path.json');
  const spec = loadCampaignSpec(file);
  const errors = validateCampaignSpec(spec);
  if (errors.length) {
    printJson({ ok: false, errors });
    process.exit(1);
  }
  if (flag('--validate-only')) {
    printJson({
      ok: true,
      validateOnly: true,
      name: spec.name,
      subject: spec.subject,
      htmlChars: spec.htmlContent.length,
      listKeys: spec.listKeys || null,
      listIds: spec.listIds || null,
    });
    return;
  }
  // list resolution needs env unless numeric listIds provided
  let payload;
  try {
    payload = buildCampaignPayload(spec);
  } catch (e) {
    if (flag('--dry-run')) {
      printJson({
        ok: false,
        dryRun: true,
        error: e.message,
        hint: 'Set BREVO_LIST_* or put numeric listIds in JSON',
      });
      process.exit(1);
    }
    throw e;
  }
  if (flag('--dry-run')) {
    printJson({
      ok: true,
      dryRun: true,
      payload: { ...payload, htmlContent: `[${payload.htmlContent.length} chars]` },
    });
    return;
  }
  const created = await brevo('POST', '/emailCampaigns', payload);
  printJson({
    ok: true,
    id: created.id,
    name: spec.name,
    subject: spec.subject,
    listIds: payload.recipients.listIds,
    next: `scripts/run-brevo.sh campaign-test --id ${created.id} --email you@example.com`,
    safety: 'Draft only — not sent. Mass send requires campaign-send gate flag or Brevo UI.',
  });
}

async function cmdCampaignGet() {
  const id = opt('--id');
  if (!id) die('campaign-get requires --id');
  const data = await brevo('GET', `/emailCampaigns/${id}`);
  printJson({
    ok: true,
    id: data.id,
    name: data.name,
    subject: data.subject,
    status: data.status,
    scheduledAt: data.scheduledAt,
    recipients: data.recipients,
    sender: data.sender,
  });
}

async function cmdCampaignTest() {
  const id = opt('--id');
  if (!id) die('campaign-test requires --id');
  const emailOpt = opt('--email', '');
  const body = {};
  if (emailOpt.trim()) {
    body.emailTo = emailOpt.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean);
    if (!body.emailTo.length) die('No valid emails in --email');
  }
  await brevo('POST', `/emailCampaigns/${id}/sendTest`, body);
  printJson({
    ok: true,
    id: Number(id),
    testedTo: body.emailTo || 'Brevo account test list',
    note: 'Test only (max ~50/day). Not a production send.',
  });
}

async function cmdCampaignSend() {
  const id = opt('--id');
  if (!id) die('campaign-send requires --id');
  if (!flag('--i-understand-send-to-production')) {
    die(
      'Refusing mass send. Pass --i-understand-send-to-production after human approval, or schedule/send in Brevo UI.',
    );
  }
  await brevo('POST', `/emailCampaigns/${id}/sendNow`);
  printJson({ ok: true, id: Number(id), action: 'sendNow', warning: 'Production send requested' });
}

async function cmdContactUpsert() {
  const email = opt('--email');
  if (!email) die('contact-upsert requires --email');
  const attributes = {};
  const fname = opt('--fname');
  const lname = opt('--lname');
  // Brevo default contact attrs are FIRSTNAME/LASTNAME (not FNAME/LNAME).
  if (fname) attributes.FIRSTNAME = fname;
  if (lname) attributes.LASTNAME = lname;
  // --attr KEY=VAL
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--attr' && args[i + 1]) {
      const [k, ...rest] = args[i + 1].split('=');
      if (k) attributes[k] = rest.join('=');
    }
  }
  const listsOpt = opt('--lists', '');
  let listIds;
  if (listsOpt.trim()) {
    const keys = listsOpt.split(',').map((s) => s.trim()).filter(Boolean);
    listIds = resolveListIds(keys);
  }
  const body = {
    email,
    updateEnabled: true,
    attributes,
  };
  if (listIds) body.listIds = listIds;
  const data = await brevo('POST', '/contacts', body);
  printJson({ ok: true, email, id: data?.id ?? null, listIds: listIds || null, attributes });
}

function cmdImportCsvPlan() {
  const file = opt('--file');
  printJson({
    ok: true,
    landing: 'A',
    file: file || null,
    steps: [
      'Clean CSV offline (dedupe, lowercase email) — do not commit PII CSVs',
      'Import in Brevo UI with attributes SOURCE=google_group_legacy LEGACY_MEMBER=true',
      'Do NOT attach Policy/Jobs/CME on import',
      'Optional holding list or attributes-only until confirm-prefs campaign',
      'Send confirm-prefs + site/membership campaign after Test',
      'See docs/email/google-group-import.md',
    ],
  });
}

async function cmdMemberEmailTest() {
  const kind = opt('--kind', 'welcome');
  const email = opt('--email');
  if (!email) die('member-email-test requires --email');
  if (!['welcome', 'renewal', 'donation'].includes(kind)) {
    die('--kind must be welcome, renewal, or donation');
  }
  const { sendMemberLifecycleEmail } = await import('../../api/_lib/brevo-member-email.js');
  const amountRaw = opt('--amount-cents', '5000');
  const result = await sendMemberLifecycleEmail(
    kind,
    {
      email,
      firstName: opt('--fname', ''),
      lastName: opt('--lname', ''),
      amountCents: kind === 'donation' ? Number(amountRaw) : undefined,
      currency: opt('--currency', 'usd'),
      frequency: opt('--frequency', 'once'),
    },
    { force: true },
  );
  printJson({
    ok: true,
    ...result,
    note: 'Transactional test (force). Production: live when BREVO_API_KEY set; kill-switch BREVO_MEMBER_EMAILS_ENABLED=false.',
  });
}

async function main() {
  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') {
    usage();
    return;
  }
  try {
    switch (cmd) {
      case 'account':
        await cmdAccount();
        break;
      case 'lists':
        await cmdLists();
        break;
      case 'setup-check':
        cmdSetupCheck();
        break;
      case 'campaign-draft':
        await cmdCampaignDraft();
        break;
      case 'campaign-get':
        await cmdCampaignGet();
        break;
      case 'campaign-test':
        await cmdCampaignTest();
        break;
      case 'campaign-send':
        await cmdCampaignSend();
        break;
      case 'contact-upsert':
        await cmdContactUpsert();
        break;
      case 'import-csv-plan':
        cmdImportCsvPlan();
        break;
      case 'member-email-test':
        await cmdMemberEmailTest();
        break;
      default:
        usage();
        die(`Unknown command: ${cmd}`);
    }
  } catch (e) {
    printJson({ ok: false, error: e.message, status: e.status || null, data: e.data || null });
    process.exit(1);
  }
}

main();
