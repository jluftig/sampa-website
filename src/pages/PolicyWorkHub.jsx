import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../lib/AuthContext';
import { formatDateOnly } from '../lib/format';
import { signedInHomePath } from '../lib/memberHome';
import {
  POLICY_WORK_CRITERIA,
  POLICY_WORK_OVERLAY_KEY,
  POLICY_WORK_STATUSES,
  hardScreenPasses,
  listPolicyWorkItems,
  mergePolicyWorkOverlay,
  parsePolicyWorkOverlay,
  policyWorkOverlayFromEdits,
  policyWorkTimeline,
  upcomingPolicyWorkDeadlines,
} from '../data/policyWork';

const STATUS_TONE = {
  watching: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
  screening: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
  drafting: 'bg-sky-500/10 text-sky-800 border-sky-500/20',
  chairs_review: 'bg-violet-500/10 text-violet-800 border-violet-500/20',
  filed: 'bg-green-500/10 text-green-800 border-green-500/20',
  declined: 'bg-red-500/10 text-red-700 border-red-500/20',
};

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function readStoredOverlay() {
  try {
    if (typeof localStorage === 'undefined') return {};
    return parsePolicyWorkOverlay(localStorage.getItem(POLICY_WORK_OVERLAY_KEY));
  } catch {
    return {};
  }
}

function writeStoredOverlay(overlay) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (!overlay || !Object.keys(overlay).length) {
      localStorage.removeItem(POLICY_WORK_OVERLAY_KEY);
      return;
    }
    localStorage.setItem(POLICY_WORK_OVERLAY_KEY, JSON.stringify(overlay));
  } catch {
    // A full or blocked store still leaves the on-screen list usable.
  }
}

export default function PolicyWorkHub() {
  const { profile } = useAuth();
  const home = signedInHomePath(profile);
  const seed = listPolicyWorkItems();
  const [items, setItems] = useState(() => mergePolicyWorkOverlay(seed, readStoredOverlay()));
  const today = todayIso();
  const deadlines = upcomingPolicyWorkDeadlines(items, today);
  const timeline = policyWorkTimeline(items);
  const hardScreen = POLICY_WORK_CRITERIA.filter((row) => row.group === 'hard_screen');
  const scorecard = POLICY_WORK_CRITERIA.filter((row) => row.group === 'scorecard');

  function commit(next) {
    setItems(next);
    writeStoredOverlay(policyWorkOverlayFromEdits(seed, next));
  }

  function patchItem(id, recipe) {
    commit(items.map((item) => (item.id === id ? recipe(item) : item)));
  }

  function resetVisit() {
    writeStoredOverlay({});
    setItems(listPolicyWorkItems());
  }

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-36 pb-24">
        <Link to={home} className="text-primary-text font-data text-sm font-semibold hover:underline">
          ← Dashboard
        </Link>
        <header className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-primary-text font-bold font-data tracking-widest text-xs mb-2 uppercase">
              Internal · Public Health Policy Committee
            </p>
            <h1 className="text-3xl md:text-4xl font-drama font-bold">Policy work</h1>
            <p className="text-text/60 mt-2 max-w-2xl text-sm">
              Response tracker for June 2026–2027. Seeded from the committee sheet.
              Checks you change here stay in this browser until you reset them.
              The seed file is the shared record.
            </p>
          </div>
          <button
            type="button"
            onClick={resetVisit}
            className="px-4 py-2 rounded-full border border-primary/20 text-sm font-semibold hover:bg-primary-text hover:text-white transition-colors"
          >
            Reset this browser
          </button>
        </header>

        <section className="bg-white rounded-2xl border border-primary/10 p-5 mb-8" aria-label="Deadlines">
          <h2 className="font-bold mb-1">Upcoming deadlines</h2>
          {deadlines.length === 0 ? (
            <p className="text-sm text-text/60">No open due dates on the sheet yet.</p>
          ) : (
            <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {deadlines.map((item) => (
                <li key={item.id} className="min-w-[220px] rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <p className="font-data text-xs text-amber-800">{formatDateOnly(item.dueDate)}</p>
                  <p className="font-semibold text-sm mt-1">{item.organization}</p>
                  <p className="text-sm text-text/70">{item.title}</p>
                </li>
              ))}
            </ul>
          )}
          <ol className="mt-4 flex gap-3 overflow-x-auto pb-1 list-none">
            {timeline.map((entry) => (
              <li key={entry.itemId} className="min-w-[200px] rounded-xl border border-primary/10 px-4 py-3">
                <p className="font-data text-xs text-text/50">
                  {entry.kind === 'due' && 'Due '}
                  {entry.kind === 'submitted' && 'Submitted '}
                  {entry.kind === 'undated' && 'No date'}
                  {entry.date ? formatDateOnly(entry.date) : ''}
                </p>
                <p className="font-semibold text-sm mt-1">
                  {entry.responseNumber}. {entry.organization}
                </p>
                <p className="text-sm text-text/70 line-clamp-2">{entry.title}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-6">
          {items.map((item) => {
            const screenOk = hardScreenPasses(item.criteria);
            return (
              <article key={item.id} className="bg-white rounded-2xl border border-primary/10 p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-data text-xs text-text/50 uppercase tracking-widest">
                      Response {item.responseNumber} · {item.organization}
                    </p>
                    <h2 className="text-xl font-drama font-bold mt-1">{item.title}</h2>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_TONE[item.status] || ''}`}>
                    {POLICY_WORK_STATUSES.find((row) => row.id === item.status)?.label}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  <label className="text-xs font-semibold block">
                    Status
                    <select
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-primary/20 bg-white text-sm font-normal"
                      value={item.status}
                      onChange={(event) => patchItem(item.id, (current) => ({
                        ...current,
                        status: event.target.value,
                      }))}
                    >
                      {POLICY_WORK_STATUSES.map((row) => (
                        <option key={row.id} value={row.id}>{row.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold block">
                    Owner
                    <input
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-primary/20 text-sm font-normal"
                      value={item.owner}
                      placeholder="Unassigned"
                      onChange={(event) => patchItem(item.id, (current) => ({
                        ...current,
                        owner: event.target.value,
                      }))}
                    />
                  </label>
                  <label className="text-xs font-semibold block">
                    Due date
                    <input
                      type="date"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-primary/20 text-sm font-normal"
                      value={item.dueDate || ''}
                      onChange={(event) => patchItem(item.id, (current) => ({
                        ...current,
                        dueDate: event.target.value || null,
                      }))}
                    />
                  </label>
                  <div className="text-xs">
                    <p className="font-semibold">Submitted</p>
                    <p className="mt-2 text-sm font-normal text-text/70">
                      {item.submittedAt ? formatDateOnly(item.submittedAt) : 'Not recorded'}
                    </p>
                    {item.submittedTo ? (
                      <p className="text-sm font-normal text-text/70">{item.submittedTo}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  {item.packetUrl ? (
                    <a className="text-primary-text font-semibold hover:underline" href={item.packetUrl} target="_blank" rel="noreferrer">
                      Response packet
                    </a>
                  ) : (
                    <span className="text-text/40">No response packet on the sheet</span>
                  )}
                  {item.publicPath ? (
                    <Link className="text-primary-text font-semibold hover:underline" to={item.publicPath}>
                      Public comment
                    </Link>
                  ) : null}
                </div>

                <div className="mt-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm">Hard screen</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${screenOk ? 'bg-green-500/10 text-green-800 border-green-500/20' : 'bg-red-500/10 text-red-700 border-red-500/20'}`}>
                      {screenOk ? 'Passes' : 'Does not pass'}
                    </span>
                  </div>
                  <p className="text-xs text-text/50 mb-2">
                    Passes when it is addiction-related and affects PAs generally, or when a priority PA organization requires it.
                  </p>
                  <ul className="space-y-2">
                    {hardScreen.map((criterion) => (
                      <li key={criterion.id}>
                        <label className="flex gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={!!item.criteria[criterion.id]}
                            onChange={(event) => patchItem(item.id, (current) => ({
                              ...current,
                              criteria: { ...current.criteria, [criterion.id]: event.target.checked },
                            }))}
                          />
                          <span>
                            <span className="font-semibold">{criterion.label}. </span>
                            {criterion.question}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5">
                  <h3 className="font-semibold text-sm mb-2">Scorecard</h3>
                  <ul className="space-y-2">
                    {scorecard.map((criterion) => (
                      <li key={criterion.id}>
                        <label className="flex gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={!!item.criteria[criterion.id]}
                            onChange={(event) => patchItem(item.id, (current) => ({
                              ...current,
                              criteria: { ...current.criteria, [criterion.id]: event.target.checked },
                            }))}
                          />
                          <span>
                            <span className="font-semibold">{criterion.label}. </span>
                            {criterion.question}
                            {criterion.polarity === 'caution' && item.criteria[criterion.id] ? (
                              <span className="ml-2 text-xs font-semibold text-amber-800">Risk flagged</span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5">
                  <h3 className="font-semibold text-sm mb-2">Punch list</h3>
                  <ul className="space-y-2">
                    {item.punchList.map((row) => (
                      <li key={row.id}>
                        <label className="flex gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={!!row.done}
                            onChange={(event) => patchItem(item.id, (current) => ({
                              ...current,
                              punchList: current.punchList.map((punch) => (
                                punch.id === row.id ? { ...punch, done: event.target.checked } : punch
                              )),
                            }))}
                          />
                          <span className={row.done ? 'line-through text-text/50' : ''}>{row.text}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
