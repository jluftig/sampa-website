import { supabaseAdmin } from './clients.js';
import { snapshotDate, snapshotRecord } from '../../src/lib/newsletterStats.js';

const COLUMNS = 'snapshot_date, list_id, total_subscribers, unique_subscribers';

export async function loadSubscriberSnapshots() {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('subscriber_snapshots')
    .select(COLUMNS)
    .order('snapshot_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertSubscriberSnapshots(rows) {
  const admin = supabaseAdmin();
  const { error } = await admin
    .from('subscriber_snapshots')
    .upsert(rows, { onConflict: 'snapshot_date,list_id' });
  if (error) throw error;
  return rows;
}

export function buildSnapshotRows(now, lists) {
  const date = snapshotDate(now);
  return (Array.isArray(lists) ? lists : []).map((list) => (
    snapshotRecord(date, list.listId, list.payload)
  ));
}
