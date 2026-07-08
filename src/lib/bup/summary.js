// Plain-text summary formatters for copy-to-EHR (and the data behind the
// print summary). Pure functions — EHR paste targets are plain-text note
// fields, so: no markdown, hyphen bullets, nothing fancier than the clinical
// characters already in the content (≥, –).
import { TOOL } from './meta';
import { protocolBySlug } from './protocols';
import { cowsBand } from './cows';

const DISCLAIMER_LINE = 'Decision support only — does not replace clinical judgment.';

// Compact timestamped COWS series (recorded via the calculator this tab)
// appended to the main summaries when scores exist. The calculator's own
// copy button uses the fuller cowsSeriesText (series + itemized latest).
function cowsSeriesLines(cowsEntries) {
  if (!cowsEntries?.length) return [];
  const lines = ['', 'COWS SCORES'];
  cowsEntries.forEach((entry, i) => {
    lines.push(
      `${i + 1}. ${new Date(entry.takenAt).toLocaleString()} — COWS ${entry.total} (${cowsBand(entry.total).label.toLowerCase()}) — ${entry.objectiveCount} objective sign${entry.objectiveCount === 1 ? '' : 's'}`
    );
  });
  return lines;
}

function headerLines(now) {
  return [
    'BUPRENORPHINE START — DECISION SUPPORT SUMMARY',
    `${TOOL.name} v${TOOL.version} — ${now.toLocaleString()}`,
  ];
}

function sourceLine(protocol) {
  return `Source: ${protocol.source.title} (rev. ${protocol.source.revised})`;
}

// result = evaluateChooser() output ({ path, outcome }).
export function chooserSummaryText(result, now = new Date(), cowsEntries = []) {
  const { path, outcome } = result;
  const lines = [...headerLines(now), '', 'INPUTS'];
  path.forEach((entry) => lines.push(`- ${entry.prompt} ${entry.label}`));
  lines.push('');

  if (!outcome) {
    lines.push('RECOMMENDATION: (incomplete — not all questions answered)');
  } else if (outcome.variant === 'dual') {
    lines.push('TWO APPROPRIATE OPTIONS — decide with the patient');
    outcome.dualOptions.forEach((opt, i) => {
      lines.push(`${i + 1}. ${opt.title}`);
      lines.push(`   ${opt.summary}`);
    });
  } else {
    lines.push(`RECOMMENDATION: ${outcome.title}`);
    if (outcome.headline) lines.push(`- ${outcome.headline}`);
    outcome.notes?.forEach((note) => lines.push(`- ${note}`));
    outcome.checklist?.forEach((item) => lines.push(`- ${item}`));
    const protocol = outcome.protocol ? protocolBySlug(outcome.protocol) : null;
    if (protocol) {
      lines.push('');
      lines.push(sourceLine(protocol));
    }
  }

  lines.push(...cowsSeriesLines(cowsEntries));
  lines.push('', TOOL.methadoneNote, '', DISCLAIMER_LINE);
  return lines.join('\n');
}

// result = evaluateSequence() output over protocol.flow.
export function protocolSummaryText(protocol, result, now = new Date(), cowsEntries = []) {
  const lines = [...headerLines(now), '', `PROTOCOL: ${protocol.title}`, ''];

  result.path.forEach((entry) => {
    const step = entry.step;
    if (entry.answerLabel !== undefined) {
      lines.push(`- ${step.prompt} ${entry.answerLabel}`);
    } else if (step.kind === 'dose') {
      lines.push(`- ${step.label}: ${step.dose}${step.range ? ` (${step.range})` : ''}`);
    } else if (step.kind === 'checklist' || step.kind === 'alert') {
      lines.push(`- ${step.title}:`);
      step.items.forEach((item) => lines.push(`  - ${item}`));
    } else if (step.kind === 'note') {
      lines.push(`- ${step.text}`);
    }
  });

  lines.push(...cowsSeriesLines(cowsEntries));
  lines.push('', TOOL.methadoneNote, '', DISCLAIMER_LINE, sourceLine(protocol));
  return lines.join('\n');
}
