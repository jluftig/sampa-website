import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabaseClient';

const EMPTY = {
  slug: '',
  title: '',
  meeting_date: '',
  time_label: '',
  location: '',
  kind: 'regular',
  format: 'virtual',
  status: 'completed',
  era: '',
  summary: '',
  agenda_status: 'not_yet',
  agenda_html: '',
  minutes_status: 'not_yet',
  minutes_html: '',
  minutes_approved_on: '',
};

function dollarsToCents(value) {
  const amount = Number(String(value).replace(/[$,]/g, ''));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function formatMoney(cents) {
  return (Number(cents) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export default function AdminRecords({ initialMeetings, initialRelay }) {
  const preview = initialMeetings != null;
  const [meetings, setMeetings] = useState(initialMeetings || []);
  const [relay, setRelay] = useState(initialRelay || null);
  const [form, setForm] = useState(EMPTY);
  const [dollars, setDollars] = useState('');
  const [asOf, setAsOf] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (preview) return undefined;
    let active = true;
    (async () => {
      const listed = await supabase
        .from('board_meetings')
        .select('slug, title, meeting_date, status, agenda_status, minutes_status, sort_index')
        .order('sort_index', { ascending: true });
      const latest = await supabase
        .from('relay_balances')
        .select('amount_cents, as_of, source')
        .order('as_of', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (listed.error) setError(listed.error.message);
      else setMeetings(listed.data || []);
      if (latest.error) setError(latest.error.message);
      else setRelay(latest.data);
    })();
    return () => { active = false; };
  }, [preview]);

  function edit(row) {
    setForm({
      ...EMPTY,
      ...row,
      meeting_date: row.meeting_date || '',
      time_label: row.time_label || '',
      location: row.location || '',
      era: row.era || '',
      summary: row.summary || '',
      agenda_html: row.agenda_html || '',
      minutes_html: row.minutes_html || '',
      minutes_approved_on: row.minutes_approved_on || '',
    });
    setMessage('');
  }

  async function openFull(slug) {
    if (preview) {
      const row = meetings.find((item) => item.slug === slug);
      if (row) edit(row);
      return;
    }
    const { data, error: loadError } = await supabase
      .from('board_meetings')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (loadError) setError(loadError.message);
    else if (data) edit(data);
  }

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveMeeting(event) {
    event.preventDefault();
    if (!form.slug.trim() || !form.title.trim()) {
      setError('Slug and title are required.');
      return;
    }
    setBusy(true);
    setError('');
    const row = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      meeting_date: form.meeting_date || null,
      time_label: form.time_label || null,
      location: form.location || null,
      kind: form.kind,
      format: form.format,
      status: form.status,
      era: form.era || null,
      summary: form.summary || null,
      agenda_status: form.agenda_status,
      agenda_html: form.agenda_html || null,
      minutes_status: form.minutes_status,
      minutes_html: form.minutes_html || null,
      minutes_approved_on: form.minutes_approved_on || null,
    };
    if (preview) {
      setMeetings((current) => {
        const next = current.filter((item) => item.slug !== row.slug);
        return [...next, row];
      });
      setMessage('Saved in the preview only.');
      setBusy(false);
      return;
    }
    const existing = meetings.some((item) => item.slug === row.slug);
    const write = existing
      ? supabase.from('board_meetings').update(row).eq('slug', row.slug)
      : supabase.from('board_meetings').insert({ ...row, sort_index: meetings.length });
    const { error: saveError } = await write;
    setBusy(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setMessage(existing ? 'Meeting updated.' : 'Meeting posted.');
    setMeetings((current) => {
      const next = current.filter((item) => item.slug !== row.slug);
      return [...next, { slug: row.slug, title: row.title, meeting_date: row.meeting_date, status: row.status }];
    });
  }

  async function recordBalance(event) {
    event.preventDefault();
    const amountCents = dollarsToCents(dollars);
    if (amountCents == null || !asOf) {
      setError('Enter a balance and the as-of date.');
      return;
    }
    setBusy(true);
    setError('');
    if (preview) {
      setRelay({ amount_cents: amountCents, as_of: asOf, source: 'Relay' });
      setMessage('Balance recorded in the preview only.');
      setBusy(false);
      return;
    }
    const { error: saveError } = await supabase.from('relay_balances').insert({
      amount_cents: amountCents,
      as_of: asOf,
      source: 'Relay',
    });
    setBusy(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setRelay({ amount_cents: amountCents, as_of: asOf, source: 'Relay' });
    setDollars('');
    setMessage('Relay balance recorded.');
  }

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <Link to="/editor" className="text-primary-text font-data text-sm font-semibold hover:underline">← Dashboard</Link>
        <h1 className="text-3xl font-drama font-bold mt-4 mb-2">Records</h1>
        <p className="text-text/60 text-sm mb-8 max-w-xl">
          Post a board meeting or record a new Relay balance. Administrators only.
          Earlier balances stay in the history.
        </p>

        {error && <p className="text-red-700 text-sm mb-4">{error}</p>}
        {message && <p className="text-primary-text text-sm mb-4">{message}</p>}

        <section className="bg-white rounded-4xl border border-primary/10 p-5 mb-6">
          <h2 className="text-lg font-bold mb-2">Relay balance</h2>
          <p className="text-text/50 text-sm mb-3">
            {relay
              ? `Latest ${formatMoney(relay.amount_cents)} as of ${relay.as_of}.`
              : 'No balance recorded yet.'}
          </p>
          <form onSubmit={recordBalance} className="flex flex-wrap gap-3 items-end">
            <label className="text-sm">
              <span className="block text-text/50 text-xs mb-1">Amount</span>
              <input
                value={dollars}
                onChange={(event) => setDollars(event.target.value)}
                inputMode="decimal"
                className="border border-primary/20 rounded-xl px-3 py-2 w-36"
                aria-label="Relay amount"
              />
            </label>
            <label className="text-sm">
              <span className="block text-text/50 text-xs mb-1">As of</span>
              <input
                type="date"
                value={asOf}
                onChange={(event) => setAsOf(event.target.value)}
                className="border border-primary/20 rounded-xl px-3 py-2"
                aria-label="Relay as-of date"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="bg-primary-text text-white rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Record balance
            </button>
          </form>
        </section>

        <section className="bg-white rounded-4xl border border-primary/10 p-5">
          <h2 className="text-lg font-bold mb-2">Board meetings</h2>
          <ul className="divide-y divide-primary/10 mb-4">
            {meetings.map((meeting) => (
              <li key={meeting.slug}>
                <button
                  type="button"
                  onClick={() => openFull(meeting.slug)}
                  className="w-full text-left py-2 hover:text-primary-text"
                >
                  <span className="font-semibold">{meeting.title}</span>
                  <span className="text-text/45 text-xs font-data ml-2">{meeting.slug}</span>
                </button>
              </li>
            ))}
            {!meetings.length && <li className="text-text/50 text-sm py-2">No meetings stored yet.</li>}
          </ul>
          <form onSubmit={saveMeeting} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="block text-text/50 text-xs mb-1">Slug</span>
                <input value={form.slug} onChange={(event) => setField('slug', event.target.value)} className="w-full border border-primary/20 rounded-xl px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-text/50 text-xs mb-1">Title</span>
                <input value={form.title} onChange={(event) => setField('title', event.target.value)} className="w-full border border-primary/20 rounded-xl px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-text/50 text-xs mb-1">Date</span>
                <input type="date" value={form.meeting_date} onChange={(event) => setField('meeting_date', event.target.value)} className="w-full border border-primary/20 rounded-xl px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-text/50 text-xs mb-1">Status</span>
                <select value={form.status} onChange={(event) => setField('status', event.target.value)} className="w-full border border-primary/20 rounded-xl px-3 py-2">
                  <option value="upcoming">upcoming</option>
                  <option value="scheduled">scheduled</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </label>
            </div>
            <label className="text-sm block">
              <span className="block text-text/50 text-xs mb-1">Agenda</span>
              <textarea value={form.agenda_html} onChange={(event) => setField('agenda_html', event.target.value)} rows={6} className="w-full border border-primary/20 rounded-xl px-3 py-2 font-data text-sm" />
            </label>
            <label className="text-sm block">
              <span className="block text-text/50 text-xs mb-1">Minutes</span>
              <textarea value={form.minutes_html} onChange={(event) => setField('minutes_html', event.target.value)} rows={6} className="w-full border border-primary/20 rounded-xl px-3 py-2 font-data text-sm" />
            </label>
            <div className="flex gap-3">
              <label className="text-sm">
                <span className="block text-text/50 text-xs mb-1">Agenda status</span>
                <select value={form.agenda_status} onChange={(event) => setField('agenda_status', event.target.value)} className="border border-primary/20 rounded-xl px-3 py-2">
                  <option value="posted">posted</option>
                  <option value="on_file">on_file</option>
                  <option value="pending">pending</option>
                  <option value="not_yet">not_yet</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="block text-text/50 text-xs mb-1">Minutes status</span>
                <select value={form.minutes_status} onChange={(event) => setField('minutes_status', event.target.value)} className="border border-primary/20 rounded-xl px-3 py-2">
                  <option value="posted">posted</option>
                  <option value="on_file">on_file</option>
                  <option value="pending">pending</option>
                  <option value="not_yet">not_yet</option>
                </select>
              </label>
            </div>
            <button type="submit" disabled={busy} className="bg-primary-text text-white rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50">
              Save meeting
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
