#!/usr/bin/env node
// Load board meetings and the Relay balance from a local JSON file.
// The file is not in git. Generate it before this change removes the
// in-repo copies, then run:
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/seed-private-records.mjs scripts/seed-private/records.json
//
// Upsert is idempotent on meeting slug. A Relay row is inserted only when
// the same amount and as-of date are not already stored.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const file = process.argv[2] || 'scripts/seed-private/records.json';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const payload = JSON.parse(readFileSync(file, 'utf8'));
const meetings = payload.meetings || [];
const relay = payload.relay || null;

function meetingRow(meeting, index) {
  return {
    slug: meeting.slug,
    title: meeting.title,
    meeting_date: meeting.date || null,
    date_label: meeting.dateLabel || null,
    time_label: meeting.time || null,
    kind: meeting.kind || 'regular',
    format: meeting.format || 'virtual',
    location: meeting.location || null,
    era: meeting.era || null,
    status: meeting.status || 'completed',
    summary: meeting.summary || null,
    agenda_status: meeting.agenda?.status || 'not_yet',
    agenda_label: meeting.agenda?.label || null,
    agenda_html: meeting.agenda?.bodyHtml || null,
    agenda_pdf_url: meeting.agenda?.pdfUrl || null,
    minutes_status: meeting.minutes?.status || 'not_yet',
    minutes_label: meeting.minutes?.label || null,
    minutes_html: meeting.minutes?.bodyHtml || null,
    minutes_pdf_url: meeting.minutes?.pdfUrl || null,
    minutes_approved_on: meeting.minutes?.approvedAt || null,
    sort_index: Number.isInteger(meeting.sortIndex) ? meeting.sortIndex : index,
  };
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rows = meetings.map(meetingRow);
const saved = await supabase.from('board_meetings').upsert(rows, { onConflict: 'slug' });
if (saved.error) {
  console.error(saved.error.message);
  process.exit(1);
}
console.log(`Upserted ${rows.length} board meetings.`);

if (relay && relay.amountCents != null && relay.asOf) {
  const existing = await supabase
    .from('relay_balances')
    .select('id')
    .eq('amount_cents', relay.amountCents)
    .eq('as_of', relay.asOf)
    .limit(1)
    .maybeSingle();
  if (existing.error) {
    console.error(existing.error.message);
    process.exit(1);
  }
  if (existing.data) {
    console.log('Relay balance already stored for that date and amount.');
  } else {
    const inserted = await supabase.from('relay_balances').insert({
      amount_cents: relay.amountCents,
      as_of: relay.asOf,
      source: relay.source || 'Relay',
    });
    if (inserted.error) {
      console.error(inserted.error.message);
      process.exit(1);
    }
    console.log('Inserted Relay balance.');
  }
}
