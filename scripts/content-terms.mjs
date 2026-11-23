#!/usr/bin/env node
// House-style copy lint. Scans prose in JSX/JS/TS, Markdown, JSON, and HTML.
// Skips comments, code identifiers, and URLs.
//
// Suppress a hit:
//   // content-terms-ignore
//   // content-terms-ignore-next-line
//   // content-terms-ignore-next-line: mat, bup-case
//   // content-terms-ignore-file
//   {/* content-terms-ignore */}
//   <!-- content-terms-ignore-file: substance-or-drug-abuse -->
// JSON has no comments. Use allowlist entries in content-style.json.
//
// Advisory rules print and do not fail CI. Prior-auth "PA" is advisory
// because SAMPA is a physician-associate organization.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OP_WORDS = new Set([
  'return', 'throw', 'case', 'void', 'typeof', 'delete', 'await', 'yield',
  'new', 'else', 'do', 'if', 'while', 'for', 'switch', 'catch', 'finally',
  'in', 'of', 'instanceof', 'extends', 'import', 'export', 'default', 'var',
  'let', 'const', 'function', 'class',
]);

const COPY_ATTRS = new Set([
  'alt', 'title', 'placeholder', 'aria-label', 'aria-description',
  'aria-placeholder', 'aria-roledescription', 'content', 'summary', 'label', 'abbr',
  'subtitle', 'accessibilitylabel', 'accessibilityhint',
]);

export function loadConfig(root = process.cwd()) {
  const file = path.join(root, 'content-style.json');
  const config = JSON.parse(readFileSync(file, 'utf8'));
  for (const rule of config.rules || []) {
    try {
      // Compile once so a bad pattern fails before any file is scanned.
      rule._re = new RegExp(rule.pattern, `${rule.flags || ''}g`);
    } catch (error) {
      throw new Error(`content-style.json rule ${rule.id}: ${error.message}`);
    }
  }
  return config;
}

export function lintRepo(root = process.cwd(), config = loadConfig(root)) {
  const files = listFiles(root, config);
  const findings = [];
  for (const file of files) {
    const abs = path.join(root, file);
    const source = readFileSync(abs, 'utf8');
    if (source.includes('\0')) continue;
    findings.push(...lintSource(file, source, config));
  }
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.col - b.col || a.rule.localeCompare(b.rule));
  return { findings, files: files.length };
}

export function lintSource(file, source, config) {
  const ext = path.extname(file).toLowerCase();
  let extracted;
  try {
    if (ext === '.json') extracted = extractJson(source, config);
    else if (ext === '.md' || ext === '.mdx') extracted = extractMarkdown(source);
    else if (ext === '.html' || ext === '.htm') extracted = extractHtml(source);
    else extracted = extractJs(source);
  } catch (error) {
    return [{
      file,
      rule: 'parse',
      severity: 'error',
      line: 1,
      col: 1,
      match: ext || file,
      message: `Could not read copy from this file (${error.message}).`,
      excerpt: '',
    }];
  }
  return applyRules(file, source, extracted, config);
}

export function hasErrors(findings) {
  return findings.some((finding) => finding.severity !== 'advisory');
}

export function formatReport(findings, fileCount = 0) {
  const errors = findings.filter((finding) => finding.severity !== 'advisory');
  const advisories = findings.filter((finding) => finding.severity === 'advisory');
  if (errors.length === 0 && advisories.length === 0) {
    return `content-terms: scanned ${fileCount} file(s), 0 errors, 0 advisories\n`;
  }
  const lines = [
    `content-terms: ${errors.length} error(s), ${advisories.length} advisory (advisories do not fail CI)`,
    '',
  ];
  const emit = (finding) => {
    lines.push(`${finding.file}:${finding.line}:${finding.col}  ${finding.rule}`);
    if (finding.excerpt) lines.push(`  ${finding.excerpt}`);
    lines.push(`  ${finding.match} → ${finding.message}`);
    lines.push('');
  };
  for (const finding of errors) emit(finding);
  if (advisories.length) {
    lines.push('Advisory (does not fail CI):');
    lines.push('');
    for (const finding of advisories) emit(finding);
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function listFiles(root, config) {
  const exts = new Set(config.extensions || []);
  const out = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      const rel = path.relative(root, abs).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if ((config.excludeDirs || []).includes(entry.name)) continue;
        if (isExcluded(rel, config)) continue;
        walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!exts.has(path.extname(entry.name).toLowerCase())) continue;
      if (isExcluded(rel, config)) continue;
      out.push(rel);
    }
  };
  for (const rootDir of config.roots || []) {
    const abs = path.join(root, rootDir);
    try {
      if (statSync(abs).isDirectory()) walk(abs);
    } catch {
      // A missing root is a config choice, not a copy failure.
    }
  }
  return out.sort();
}

function isExcluded(rel, config) {
  const base = rel.slice(rel.lastIndexOf('/') + 1);
  const files = config.excludeFiles || [];
  if (files.includes(base) || files.includes(rel)) return true;
  return rel.split('/').some((part) => (config.excludeDirs || []).includes(part));
}

function applyRules(file, source, extracted, config) {
  const findings = [];
  const directives = extracted.directives || emptyDirectives();
  for (const segment of extracted.segments || []) {
    for (const rule of config.rules || []) {
      const masked = maskSegment(segment.text, rule);
      const re = new RegExp(rule.pattern, `${rule.flags || ''}g`);
      for (const match of masked.matchAll(re)) {
        const at = segment.map[match.index];
        if (at == null) continue;
        const pos = positionOf(source, at);
        if (suppressed(directives, pos.line, rule.id)) continue;
        const finding = {
          file,
          rule: rule.id,
          severity: rule.severity || 'error',
          line: pos.line,
          col: pos.col,
          match: match[0],
          message: rule.message,
          excerpt: excerptAt(source, at, match[0].length),
        };
        if (allowlisted(config, finding, lineText(source, pos.line))) continue;
        findings.push(finding);
      }
    }
  }
  return findings;
}

function maskSegment(text, rule) {
  let out = text.replace(/https?:\/\/[^\s"'<>)]+/gi, (url) => ' '.repeat(url.length));
  out = out.replace(/\bwww\.[^\s"'<>)]+/gi, (url) => ' '.repeat(url.length));
  out = out.replace(/mailto:[^\s"'<>)]+/gi, (url) => ' '.repeat(url.length));
  out = maskPhrases(out, rule.allowPhrases || [], false);
  out = maskPhrases(out, rule.allowPhrasesInsensitive || [], true);
  return out;
}

function maskPhrases(text, phrases, insensitive) {
  let out = text;
  const ordered = [...phrases].filter(Boolean).sort((a, b) => b.length - a.length);
  for (const phrase of ordered) {
    const pattern = phrasePattern(phrase, insensitive);
    if (!pattern) continue;
    out = out.replace(pattern, (match) => ' '.repeat(match.length));
  }
  return out;
}

function phrasePattern(phrase, insensitive) {
  const words = phrase.trim().split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (!words.length) return null;
  return new RegExp(`\\b${words.join('\\s+')}\\b`, insensitive ? 'gi' : 'g');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function allowlisted(config, finding, text) {
  return (config.allowlist || []).some((entry) => {
    if (entry.file && entry.file !== finding.file) return false;
    if (entry.rule && entry.rule !== finding.rule) return false;
    if (entry.line && entry.line !== finding.line) return false;
    if (entry.contains && !text.includes(entry.contains) && !finding.excerpt.includes(entry.contains)) return false;
    return Boolean(entry.file || entry.rule);
  });
}

function suppressed(directives, line, ruleId) {
  if (directives.file && covers(directives.file, ruleId)) return true;
  if (covers(directives.lines.get(line), ruleId)) return true;
  if (covers(directives.next.get(line - 1), ruleId)) return true;
  return false;
}

function covers(ruleIds, ruleId) {
  if (ruleIds == null) return false;
  if (ruleIds === '*') return true;
  return ruleIds.includes(ruleId);
}

function emptyDirectives() {
  return { file: null, lines: new Map(), next: new Map() };
}

function noteComment(directives, body, bodyStart, source) {
  const specs = [
    ['file', /content-terms-ignore-file\b/],
    ['next', /content-terms-ignore-next-line\b/],
    ['line', /content-terms-ignore(?!-)\b/],
  ];
  for (const [kind, re] of specs) {
    const match = re.exec(body);
    if (!match) continue;
    const line = positionOf(source, bodyStart + match.index).line;
    const ids = ruleList(body.slice(match.index));
    if (kind === 'file') directives.file = ids;
    else if (kind === 'next') directives.next.set(line, ids);
    else directives.lines.set(line, ids);
    return;
  }
}

function ruleList(text) {
  const match = text.match(/^content-terms-ignore(?:-file|-next-line)?\s*:\s*([a-z0-9-]+(?:\s*,\s*[a-z0-9-]+)*)/);
  if (!match) return '*';
  return match[1].split(/\s*,\s*/);
}

function shouldKeep(text) {
  const trimmed = text.trim();
  if (!trimmed || !/[A-Za-z]/.test(trimmed)) return false;
  if (/^(?:https?:|mailto:|data:)/i.test(trimmed)) return false;
  if (/^(?:\.?\.?\/|@\/)/.test(trimmed) && !/\s/.test(trimmed)) return false;
  // Kebab and snake tokens are ids and slugs. A single lowercase word can be copy.
  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(trimmed)) return false;
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return false;
  return true;
}

function positionOf(source, index) {
  let line = 1;
  let col = 1;
  const end = Math.min(index, source.length);
  for (let i = 0; i < end; i += 1) {
    if (source[i] === '\n') {
      line += 1;
      col = 1;
    } else {
      col += 1;
    }
  }
  return { line, col };
}

function lineText(source, line) {
  return source.split('\n')[line - 1] || '';
}

function excerptAt(source, index, length) {
  const start = source.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  const endBreak = source.indexOf('\n', index);
  const end = endBreak === -1 ? source.length : endBreak;
  const line = source.slice(start, end).trim();
  if (line.length <= 180) return line;
  const col = index - start;
  const from = Math.max(0, col - 50);
  const chunk = source.slice(start, end).slice(from, col + length + 50).trim();
  return `${from > 0 ? '…' : ''}${chunk}…`;
}

function extractJs(source) {
  const ctx = {
    source,
    n: source.length,
    i: 0,
    lastSig: 'op',
    segments: [],
    directives: emptyDirectives(),
  };
  scanJs(ctx, {});
  return ctx;
}

function bump(ctx, label) {
  ctx.steps = (ctx.steps || 0) + 1;
  const limit = Math.max(100000, ctx.n * 50);
  if (ctx.steps > limit) {
    throw new Error(`runaway ${label} at index ${ctx.i}`);
  }
}

function scanJs(ctx, opts) {
  let brace = 0;
  while (ctx.i < ctx.n) {
    bump(ctx, 'scanJs');
    const start = ctx.i;
    const c = ctx.source[ctx.i];
    if (c === '"' || c === "'") {
      const quoteAt = ctx.i;
      const segment = readQuoted(ctx, c);
      if (segment && !isObjectKey(ctx, quoteAt) && shouldKeep(segment.text)) ctx.segments.push(segment);
      ctx.lastSig = 'value';
      continue;
    }
    if (c === '`') {
      readTemplate(ctx);
      ctx.lastSig = 'value';
      continue;
    }
    if (c === '/' && ctx.source[ctx.i + 1] === '/') {
      skipLineComment(ctx);
      continue;
    }
    if (c === '/' && ctx.source[ctx.i + 1] === '*') {
      skipBlockComment(ctx);
      continue;
    }
    if (c === '/' && ctx.lastSig !== 'value') {
      skipRegex(ctx);
      ctx.lastSig = 'value';
      continue;
    }
    if (c === '<' && startsJsx(ctx)) {
      readJsxElement(ctx);
      ctx.lastSig = 'value';
      continue;
    }
    if (c === '{') {
      brace += 1;
      ctx.i += 1;
      ctx.lastSig = 'op';
      continue;
    }
    if (c === '}') {
      if (brace === 0 && opts.stopBrace) {
        ctx.i += 1;
        return;
      }
      if (brace > 0) brace -= 1;
      ctx.i += 1;
      ctx.lastSig = 'value';
      continue;
    }
    if (c === '(' || c === '[') {
      ctx.i += 1;
      ctx.lastSig = 'op';
      continue;
    }
    if (c === ')' || c === ']') {
      ctx.i += 1;
      ctx.lastSig = 'value';
      continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      const word = readIdent(ctx);
      ctx.lastSig = OP_WORDS.has(word) ? 'op' : 'value';
      ctx.lastWord = word;
      continue;
    }
    if (/[0-9]/.test(c)) {
      skipNumber(ctx);
      ctx.lastSig = 'value';
      continue;
    }
    if (!/\s/.test(c)) ctx.lastSig = 'op';
    ctx.i += 1;
    if (ctx.i === start) ctx.i += 1;
  }
}

function startsJsx(ctx) {
  const next = ctx.source[ctx.i + 1];
  if (!(next === '>' || next === '/' || /[A-Za-z_]/.test(next || ''))) return false;
  if (looksLikeGeneric(ctx)) return false;
  let j = ctx.i - 1;
  while (j >= 0 && /\s/.test(ctx.source[j])) j -= 1;
  if (j < 0) return true;
  const prev = ctx.source[j];
  if (/[A-Za-z0-9_$]/.test(prev)) {
    return ctx.lastWord === 'return' || ctx.lastWord === 'yield' || ctx.lastWord === 'throw' || ctx.lastWord === 'case' || ctx.lastWord === 'default';
  }
  return true;
}

function looksLikeGeneric(ctx) {
  let j = ctx.i + 1;
  if (!/[A-Za-z_]/.test(ctx.source[j] || '')) return false;
  while (/[A-Za-z0-9_]/.test(ctx.source[j] || '')) j += 1;
  if (ctx.source[j] === ',') return true;
  if (ctx.source.slice(j, j + 9) === ' extends ') return true;
  if (ctx.source[j] === '>') {
    let k = j + 1;
    while (/\s/.test(ctx.source[k] || '')) k += 1;
    if (ctx.source[k] === '(') return true;
  }
  return false;
}

function readJsxElement(ctx) {
  ctx.i += 1;
  if (ctx.source[ctx.i] === '>') {
    ctx.i += 1;
    readJsxChildren(ctx);
    return;
  }
  skipJsxName(ctx);
  const selfClosing = readAttrs(ctx);
  if (!selfClosing) readJsxChildren(ctx);
}

function readJsxChildren(ctx) {
  while (ctx.i < ctx.n) {
    bump(ctx, 'jsx-children');
    const c = ctx.source[ctx.i];
    if (c === '<' && ctx.source[ctx.i + 1] === '/') {
      ctx.i += 2;
      skipJsxName(ctx);
      while (ctx.i < ctx.n && ctx.source[ctx.i] !== '>') ctx.i += 1;
      if (ctx.source[ctx.i] === '>') ctx.i += 1;
      return;
    }
    if (c === '<') {
      const next = ctx.source[ctx.i + 1];
      if (next === '>' || /[A-Za-z_]/.test(next || '')) {
        readJsxElement(ctx);
        continue;
      }
    }
    if (c === '{') {
      ctx.i += 1;
      const saved = ctx.lastSig;
      ctx.lastSig = 'op';
      scanJs(ctx, { stopBrace: true });
      ctx.lastSig = saved;
      continue;
    }
    const textStart = ctx.i;
    const map = [];
    let text = '';
    while (ctx.i < ctx.n && ctx.source[ctx.i] !== '<' && ctx.source[ctx.i] !== '{') {
      map.push(ctx.i);
      text += ctx.source[ctx.i];
      ctx.i += 1;
    }
    if (ctx.i === textStart) {
      map.push(ctx.i);
      text += ctx.source[ctx.i];
      ctx.i += 1;
    }
    if (shouldKeep(text)) ctx.segments.push({ text, map });
  }
}

function readAttrs(ctx) {
  while (ctx.i < ctx.n) {
    bump(ctx, 'attrs');
    skipSpace(ctx);
    if (ctx.source[ctx.i] === '>') {
      ctx.i += 1;
      return false;
    }
    if (ctx.source[ctx.i] === '/' && ctx.source[ctx.i + 1] === '>') {
      ctx.i += 2;
      return true;
    }
    if (ctx.source[ctx.i] === '{') {
      ctx.i += 1;
      ctx.lastSig = 'op';
      scanJs(ctx, { stopBrace: true });
      continue;
    }
    const nameStart = ctx.i;
    while (/[A-Za-z0-9_.:@-]/.test(ctx.source[ctx.i] || '')) ctx.i += 1;
    const name = ctx.source.slice(nameStart, ctx.i).toLowerCase();
    if (ctx.i === nameStart) {
      ctx.i += 1;
      continue;
    }
    skipSpace(ctx);
    if (ctx.source[ctx.i] !== '=') continue;
    ctx.i += 1;
    skipSpace(ctx);
    const quote = ctx.source[ctx.i];
    if (quote === '"' || quote === "'") {
      const segment = readQuoted(ctx, quote);
      if (segment && COPY_ATTRS.has(name) && shouldKeep(segment.text)) ctx.segments.push(segment);
      continue;
    }
    if (ctx.source[ctx.i] === '{') {
      ctx.i += 1;
      ctx.lastSig = 'op';
      scanJs(ctx, { stopBrace: true });
    }
  }
  return false;
}

function skipJsxName(ctx) {
  while (/[A-Za-z0-9_.:-]/.test(ctx.source[ctx.i] || '')) ctx.i += 1;
}

function isObjectKey(ctx, quoteAt) {
  let after = ctx.i;
  while (/\s/.test(ctx.source[after] || '')) after += 1;
  if (ctx.source[after] !== ':') return false;
  let before = quoteAt - 1;
  while (before >= 0 && /\s/.test(ctx.source[before])) before -= 1;
  return ctx.source[before] === '{' || ctx.source[before] === ',';
}

function readQuoted(ctx, quote) {
  ctx.i += 1;
  let text = '';
  const map = [];
  while (ctx.i < ctx.n) {
    const c = ctx.source[ctx.i];
    if (c === '\\') {
      const next = ctx.source[ctx.i + 1] || '';
      map.push(ctx.i + 1);
      text += next === 'n' ? '\n' : next === 't' ? '\t' : next;
      ctx.i += 2;
      continue;
    }
    if (c === quote) {
      ctx.i += 1;
      break;
    }
    if ((quote === '"' || quote === "'") && c === '\n') break;
    map.push(ctx.i);
    text += c;
    ctx.i += 1;
  }
  return { text, map };
}

function readTemplate(ctx) {
  ctx.i += 1;
  let text = '';
  let map = [];
  const push = () => {
    if (shouldKeep(text)) ctx.segments.push({ text, map });
    text = '';
    map = [];
  };
  while (ctx.i < ctx.n) {
    const c = ctx.source[ctx.i];
    if (c === '\\') {
      const next = ctx.source[ctx.i + 1] || '';
      map.push(ctx.i + 1);
      text += next === 'n' ? '\n' : next;
      ctx.i += 2;
      continue;
    }
    if (c === '`') {
      ctx.i += 1;
      push();
      return;
    }
    if (c === '$' && ctx.source[ctx.i + 1] === '{') {
      push();
      ctx.i += 2;
      ctx.lastSig = 'op';
      scanJs(ctx, { stopBrace: true });
      continue;
    }
    map.push(ctx.i);
    text += c;
    ctx.i += 1;
  }
  push();
}

function skipLineComment(ctx) {
  const bodyStart = ctx.i + 2;
  ctx.i += 2;
  while (ctx.i < ctx.n && ctx.source[ctx.i] !== '\n') ctx.i += 1;
  noteComment(ctx.directives, ctx.source.slice(bodyStart, ctx.i), bodyStart, ctx.source);
}

function skipBlockComment(ctx) {
  const bodyStart = ctx.i + 2;
  ctx.i += 2;
  while (ctx.i < ctx.n && !(ctx.source[ctx.i] === '*' && ctx.source[ctx.i + 1] === '/')) ctx.i += 1;
  const body = ctx.source.slice(bodyStart, ctx.i);
  if (ctx.i < ctx.n) ctx.i += 2;
  noteComment(ctx.directives, body, bodyStart, ctx.source);
}

function skipRegex(ctx) {
  const start = ctx.i;
  ctx.i += 1;
  let inClass = false;
  while (ctx.i < ctx.n) {
    const c = ctx.source[ctx.i];
    if (c === '\n') {
      ctx.i = start + 1;
      return;
    }
    if (c === '\\') {
      ctx.i += 2;
      continue;
    }
    if (c === '[') {
      inClass = true;
      ctx.i += 1;
      continue;
    }
    if (c === ']' && inClass) {
      inClass = false;
      ctx.i += 1;
      continue;
    }
    if (c === '/' && !inClass) {
      ctx.i += 1;
      break;
    }
    ctx.i += 1;
  }
  while (/[a-z]/i.test(ctx.source[ctx.i] || '')) ctx.i += 1;
}

function skipSpace(ctx) {
  while (/\s/.test(ctx.source[ctx.i] || '')) ctx.i += 1;
}

function readIdent(ctx) {
  const start = ctx.i;
  ctx.i += 1;
  while (/[A-Za-z0-9_$]/.test(ctx.source[ctx.i] || '')) ctx.i += 1;
  return ctx.source.slice(start, ctx.i);
}

function skipNumber(ctx) {
  if (ctx.source[ctx.i] === '0' && /[xXoObB]/.test(ctx.source[ctx.i + 1] || '')) ctx.i += 2;
  while (/[0-9a-fA-F_.]/.test(ctx.source[ctx.i] || '')) ctx.i += 1;
}

function extractJson(source, config) {
  const skipKeys = new Set(config.skipKeys || []);
  const segments = [];
  let i = 0;
  const n = source.length;
  const skipWs = () => {
    while (i < n && /\s/.test(source[i])) i += 1;
  };
  const readString = () => {
    const quoteAt = i;
    if (source[i] !== '"') {
      throw new Error(`expected a string at ${quoteAt}`);
    }
    i += 1;
    let text = '';
    const map = [];
    while (i < n) {
      const c = source[i];
      if (c === '\\') {
        const next = source[i + 1] || '';
        map.push(i + 1);
        text += next === 'n' ? '\n' : next === 't' ? '\t' : next === 'u' ? ' ' : next;
        i += next === 'u' ? 6 : 2;
        continue;
      }
      if (c === '"') {
        i += 1;
        break;
      }
      map.push(i);
      text += c;
      i += 1;
    }
    return { text, map };
  };
  const parseValue = (key) => {
    skipWs();
    const c = source[i];
    if (c === '"') {
      const segment = readString();
      if (key && !skipKeys.has(key) && shouldKeep(segment.text)) segments.push(segment);
      return;
    }
    if (c === '{') {
      i += 1;
      while (i < n) {
        skipWs();
        if (source[i] === '}') {
          i += 1;
          return;
        }
        const keySeg = readString();
        skipWs();
        if (source[i] === ':') i += 1;
        parseValue(keySeg.text);
        skipWs();
        if (source[i] === ',') {
          i += 1;
          continue;
        }
        if (source[i] === '}') {
          i += 1;
          return;
        }
        throw new Error(`bad object at ${i}`);
      }
      return;
    }
    if (c === '[') {
      i += 1;
      while (i < n) {
        skipWs();
        if (source[i] === ']') {
          i += 1;
          return;
        }
        parseValue(key);
        skipWs();
        if (source[i] === ',') {
          i += 1;
          continue;
        }
        if (source[i] === ']') {
          i += 1;
          return;
        }
        throw new Error(`bad array at ${i}`);
      }
      return;
    }
    while (i < n && !/[\s,\]}]/.test(source[i])) i += 1;
  };
  skipWs();
  if (i < n) parseValue(null);
  return { segments, directives: emptyDirectives() };
}

function extractMarkdown(source) {
  const directives = emptyDirectives();
  const segments = [];
  const lines = source.split('\n');
  let fence = null;
  let offset = 0;
  for (const line of lines) {
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!fence) fence = marker;
      else if (fence === marker) fence = null;
      offset += line.length + 1;
      continue;
    }
    if (!fence) {
      const comment = line.match(/<!--([\s\S]*?)-->/g);
      if (comment) {
        for (const block of comment) {
          const at = line.indexOf(block);
          noteComment(directives, block, offset + at, source);
        }
      }
      let text = line;
      text = text.replace(/`[^`]*`/g, (code) => ' '.repeat(code.length));
      text = text.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (full, label) => {
        const pad = ' '.repeat(Math.max(0, full.length - label.length));
        return `${label}${pad}`.slice(0, full.length);
      });
      text = text.replace(/https?:\/\/\S+/g, (url) => ' '.repeat(url.length));
      text = text.replace(/<!--([\s\S]*?)-->/g, (block) => ' '.repeat(block.length));
      if (shouldKeep(text)) {
        const map = [];
        for (let i = 0; i < text.length; i += 1) map.push(offset + i);
        segments.push({ text, map });
      }
    }
    offset += line.length + 1;
  }
  return { segments, directives };
}

function extractHtml(source) {
  const directives = emptyDirectives();
  const segments = [];
  let i = 0;
  const n = source.length;
  const lower = source.toLowerCase();
  while (i < n) {
    if (lower.startsWith('<!--', i)) {
      const end = lower.indexOf('-->', i + 4);
      const stop = end === -1 ? n : end;
      noteComment(directives, source.slice(i + 4, stop), i + 4, source);
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (lower.startsWith('<script', i) || lower.startsWith('<style', i)) {
      const tag = lower.startsWith('<script', i) ? 'script' : 'style';
      const end = lower.indexOf(`</${tag}`, i + tag.length);
      if (end === -1) {
        i = n;
      } else {
        const close = lower.indexOf('>', end);
        i = close === -1 ? n : close + 1;
      }
      continue;
    }
    if (source[i] === '<') {
      i += 1;
      if (source[i] === '/' || source[i] === '!') {
        while (i < n && source[i] !== '>') i += 1;
        if (source[i] === '>') i += 1;
        continue;
      }
      while (i < n && source[i] !== '>' && !/\s/.test(source[i])) i += 1;
      while (i < n && source[i] !== '>') {
        if (source[i] === '/' && source[i + 1] === '>') break;
        while (i < n && /\s/.test(source[i])) i += 1;
        const nameStart = i;
        while (i < n && /[A-Za-z0-9_.:@-]/.test(source[i])) i += 1;
        if (i === nameStart) {
          i += 1;
          continue;
        }
        const name = source.slice(nameStart, i).toLowerCase();
        while (i < n && /\s/.test(source[i])) i += 1;
        if (source[i] !== '=') continue;
        i += 1;
        while (i < n && /\s/.test(source[i])) i += 1;
        const quote = source[i];
        if (quote !== '"' && quote !== "'") continue;
        i += 1;
        const map = [];
        let text = '';
        while (i < n && source[i] !== quote) {
          map.push(i);
          text += source[i];
          i += 1;
        }
        if (source[i] === quote) i += 1;
        if (COPY_ATTRS.has(name) && shouldKeep(text)) segments.push({ text, map });
      }
      if (source[i] === '>') i += 1;
      continue;
    }
    const map = [];
    let text = '';
    while (i < n && source[i] !== '<') {
      map.push(i);
      text += source[i];
      i += 1;
    }
    if (shouldKeep(text)) segments.push({ text, map });
  }
  return { segments, directives };
}

function main() {
  const root = process.cwd();
  const config = loadConfig(root);
  const { findings, files } = lintRepo(root, config);
  const report = formatReport(findings, files);
  if (hasErrors(findings)) {
    console.error(report);
    process.exit(1);
  }
  console.log(report);
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) main();
