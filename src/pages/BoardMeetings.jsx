import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  BOARD_HUB,
  listBoardMeetings,
  upcomingMeetings,
  meetingsWithAgenda,
  meetingsWithMinutes,
  kindLabel,
  recordTypeLabel,
  meetingStatusLabel,
  docStatusLabel,
  hasFullBody,
  hasListedDoc,
} from '../data/boardMeetings';
import { formatDateOnly } from '../lib/format';

const TABS = [
  { id: 'agendas', label: 'Agendas' },
  { id: 'records', label: 'Records' },
  { id: 'schedule', label: 'Schedule' },
];

function meetingWhen(meeting) {
  if (meeting.date) {
    const start = formatDateOnly(meeting.date);
    return meeting.time ? `${start} · ${meeting.time}` : start;
  }
  return meeting.dateLabel || 'Date to be announced';
}

function meetingDateLabel(meeting) {
  if (meeting.date) return formatDateOnly(meeting.date);
  return meeting.dateLabel || 'Date to be announced';
}

function formatLabel(format) {
  if (format === 'in-person') return 'In person';
  if (format === 'hybrid') return 'Hybrid';
  return 'Virtual';
}

function StatusChip({ children, tone = 'neutral' }) {
  const cls =
    tone === 'ready'
      ? 'bg-green-500/10 text-green-800'
      : tone === 'soon'
        ? 'bg-amber-500/10 text-amber-800'
        : 'bg-primary/10 text-primary-text';
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold font-data uppercase tracking-wider ${cls}`}>
      {children}
    </span>
  );
}

function docTone(doc) {
  if (hasFullBody(doc)) return 'ready';
  if (hasListedDoc(doc)) return 'soon';
  return 'neutral';
}

function tabFromHash(hash) {
  const id = (hash || '').replace('#', '');
  return TABS.some((t) => t.id === id) ? id : 'agendas';
}

export default function BoardMeetings() {
  const meetings = useMemo(() => listBoardMeetings(), []);
  const upcoming = useMemo(() => upcomingMeetings(meetings), [meetings]);
  const agendas = useMemo(() => meetingsWithAgenda(meetings), [meetings]);
  const records = useMemo(() => meetingsWithMinutes(meetings), [meetings]);
  const nextUp = upcoming[0] || null;
  const { hash } = useLocation();
  const navigate = useNavigate();
  const tab = tabFromHash(hash);

  const setTab = (id) => {
    navigate({ pathname: '/board', hash: id }, { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 pt-32 pb-24">
        <header className="max-w-3xl mb-12 md:mb-16">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="text-primary-text font-bold font-data tracking-widest text-sm uppercase">
              {BOARD_HUB.eyebrow}
            </div>
            <span className="text-xs font-data uppercase tracking-wider text-accent font-semibold">
              {BOARD_HUB.workingYear}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">
            {BOARD_HUB.title}
          </h1>
          <p className="text-xl text-text/70 leading-relaxed mb-4">
            {BOARD_HUB.oneLiner}
          </p>
          <p className="text-text/65 leading-relaxed max-w-2xl">
            {BOARD_HUB.cadence}{' '}
            <Link to="/about#leadership" className="text-primary-text font-semibold hover:underline">
              Public leadership roster
            </Link>
            {' · '}
            <Link to="/dashboard" className="text-primary-text font-semibold hover:underline">
              Dashboard
            </Link>
            .
          </p>
        </header>

        {nextUp && (
          <section className="mb-10 md:mb-12" aria-labelledby="next-heading">
            <h2 id="next-heading" className="sr-only">
              Next meeting
            </h2>
            <Link
              to={`/board/${nextUp.slug}`}
              className="group flex flex-col bg-white rounded-4xl border border-primary/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-8 max-w-3xl"
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <StatusChip>{meetingStatusLabel(nextUp.status)}</StatusChip>
                <span className="text-sm text-text/50 font-data">{kindLabel(nextUp.kind)}</span>
              </div>
              <h3 className="text-xl md:text-2xl font-drama font-bold text-text group-hover:text-primary-text transition-colors mb-3 leading-snug">
                {nextUp.title}
              </h3>
              <p className="text-text/70 leading-relaxed mb-6">{nextUp.summary}</p>
              <div className="mt-auto flex flex-wrap items-center gap-4 text-sm text-text/50">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  {meetingWhen(nextUp)}
                  {' · '}
                  {formatLabel(nextUp.format)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-primary-text font-semibold group-hover:underline">
                  Agenda and records
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </section>
        )}

        <div
          role="tablist"
          aria-label="Board meeting materials"
          className="flex flex-wrap gap-2 mb-8"
        >
          {TABS.map((t) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`board-tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`board-panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  selected
                    ? 'bg-primary-text text-white'
                    : 'bg-white border border-primary/15 text-text/70 hover:border-primary/40'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'agendas' && (
          <section
            role="tabpanel"
            id="board-panel-agendas"
            aria-labelledby="board-tab-agendas"
          >
            <h2 className="text-2xl md:text-3xl font-drama font-bold mb-4">
              Board meeting agendas
            </h2>
            <p className="text-lg text-text/70 leading-relaxed max-w-3xl mb-8">
              {BOARD_HUB.agendasIntro}
            </p>
            <ul className="space-y-4">
              {agendas.map((meeting) => (
                <li key={`${meeting.slug}-agenda`}>
                  <Link
                    to={`/board/${meeting.slug}#agenda`}
                    className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 bg-white rounded-3xl border border-primary/10 px-6 py-5 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <StatusChip tone={docTone(meeting.agenda)}>Agenda</StatusChip>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text leading-snug mb-1">
                        {meetingDateLabel(meeting)} {kindLabel(meeting.kind)}
                      </h3>
                      <p className="text-sm text-text/50">{meeting.title}</p>
                    </div>
                    <span className="shrink-0 text-sm text-text/45 font-data">
                      {docStatusLabel(meeting.agenda.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'records' && (
          <section
            role="tabpanel"
            id="board-panel-records"
            aria-labelledby="board-tab-records"
          >
            <h2 className="text-2xl md:text-3xl font-drama font-bold mb-4">
              Board meeting records
            </h2>
            <p className="text-lg text-text/70 leading-relaxed max-w-3xl mb-8">
              {BOARD_HUB.recordsIntro}
            </p>
            {records.length === 0 ? (
              <div className="text-center bg-white rounded-4xl border border-primary/10 p-16 max-w-2xl mx-auto">
                <FileText className="w-10 h-10 text-primary/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No minutes listed yet</h3>
                <p className="text-text/60">
                  After a meeting, minutes are drafted, approved at a later
                  meeting, then posted on that meeting’s page.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {records.map((meeting) => (
                  <li key={`${meeting.slug}-minutes`}>
                    <Link
                      to={`/board/${meeting.slug}#minutes`}
                      className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 bg-white rounded-3xl border border-primary/10 px-6 py-5 hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <StatusChip tone={docTone(meeting.minutes)}>Minutes</StatusChip>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text leading-snug mb-1">
                          {meetingDateLabel(meeting)} {recordTypeLabel(meeting)}
                        </h3>
                        <p className="text-sm text-text/50">{meeting.title}</p>
                      </div>
                      <span className="shrink-0 text-sm text-text/45 font-data">
                        {docStatusLabel(meeting.minutes.status)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'schedule' && (
          <section
            role="tabpanel"
            id="board-panel-schedule"
            aria-labelledby="board-tab-schedule"
          >
            <h2 className="text-2xl md:text-3xl font-drama font-bold mb-4">
              Board meeting schedule
            </h2>
            <p className="text-lg text-text/70 leading-relaxed max-w-3xl mb-8">
              {BOARD_HUB.scheduleIntro}
            </p>
            <div className="overflow-x-auto rounded-3xl border border-primary/10 bg-white">
              <table className="w-full min-w-[44rem] text-left text-sm md:text-base">
                <caption className="sr-only">
                  SAMPA Board meeting schedule, newest first
                </caption>
                <thead>
                  <tr className="border-b border-primary/10 bg-primary/5">
                    <th scope="col" className="px-5 py-4 font-semibold text-text">Date</th>
                    <th scope="col" className="px-5 py-4 font-semibold text-text">Time</th>
                    <th scope="col" className="px-5 py-4 font-semibold text-text">Type</th>
                    <th scope="col" className="px-5 py-4 font-semibold text-text">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting) => (
                    <tr key={meeting.slug} className="border-b border-primary/10 last:border-b-0 align-top">
                      <th scope="row" className="px-5 py-4 font-semibold text-text/90">
                        <Link
                          to={`/board/${meeting.slug}`}
                          className="text-primary-text hover:underline"
                        >
                          {meetingDateLabel(meeting)}
                        </Link>
                        {meeting.status === 'upcoming' && (
                          <div className="font-normal text-sm text-accent mt-1">
                            Upcoming
                          </div>
                        )}
                      </th>
                      <td className="px-5 py-4 text-text/70">{meeting.time || '—'}</td>
                      <td className="px-5 py-4 text-text/70">{kindLabel(meeting.kind)}</td>
                      <td className="px-5 py-4 text-text/70">
                        {meeting.location || formatLabel(meeting.format)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <p className="mt-20 text-sm text-text/45 max-w-2xl leading-relaxed">
          {BOARD_HUB.disclaimer}
        </p>
      </main>

      <Footer />
    </div>
  );
}
