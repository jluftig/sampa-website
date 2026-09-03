import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  BOARD_HUB,
  listBoardMeetings,
  meetingsWithAgenda,
  meetingsWithMinutes,
  agendaListTitle,
  recordListTitle,
  nextStandingBoardDates,
  docStatusLabel,
  hasFullBody,
  hasListedDoc,
} from '../data/boardMeetings';

const TABS = [
  { id: 'agendas', label: 'Agendas' },
  { id: 'records', label: 'Records' },
  { id: 'schedule', label: 'Schedule' },
];

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
  const agendas = useMemo(() => meetingsWithAgenda(meetings), [meetings]);
  const records = useMemo(() => meetingsWithMinutes(meetings), [meetings]);
  const standing = useMemo(() => nextStandingBoardDates(2, new Date(), meetings), [meetings]);
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
          <div className="text-primary-text font-bold font-data tracking-widest text-sm uppercase mb-4">
            {BOARD_HUB.eyebrow}
          </div>
          <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">
            {BOARD_HUB.title}
          </h1>
          <p className="text-xl text-text/70 leading-relaxed mb-4">
            {BOARD_HUB.oneLiner}
          </p>
          <p className="text-text/65 leading-relaxed max-w-2xl mb-4">
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
          <p className="text-text/65 leading-relaxed max-w-2xl">
            {BOARD_HUB.hubObserverNote}{' '}
            <button
              type="button"
              onClick={() => setTab('schedule')}
              className="text-primary-text font-semibold hover:underline"
            >
              Open Schedule
            </button>
            .
          </p>
        </header>

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
                      <h3 className="font-bold text-text leading-snug">
                        {agendaListTitle(meeting)}
                      </h3>
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
                        <h3 className="font-bold text-text leading-snug">
                          {recordListTitle(meeting)}
                        </h3>
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
            className="max-w-3xl"
          >
            <h2 className="text-2xl md:text-3xl font-drama font-bold mb-4">
              Board meeting schedule
            </h2>
            <p className="text-lg text-text/70 leading-relaxed mb-8">
              {BOARD_HUB.scheduleStanding}
            </p>

            <ul className="space-y-4 mb-12">
              {standing.map((row) => (
                <li key={row.date}>
                  {row.slug ? (
                    <Link
                      to={`/board/${row.slug}`}
                      className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 bg-white rounded-3xl border border-primary/10 px-6 py-5 hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text leading-snug mb-1">
                          {row.dateLabel} Board Meeting
                        </h3>
                        <p className="text-sm text-text/50">
                          {row.time} · {row.location}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm text-primary-text font-semibold">
                        Agenda
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </Link>
                  ) : (
                    <div className="bg-white rounded-3xl border border-primary/10 px-6 py-5">
                      <h3 className="font-bold text-text leading-snug mb-1">
                        {row.dateLabel} Board Meeting
                      </h3>
                      <p className="text-sm text-text/50">
                        {row.time} · {row.location}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <h3 className="text-xl font-drama font-bold mb-3">
              Annual Membership Meeting
            </h3>
            <p className="text-text/70 leading-relaxed mb-12">
              {BOARD_HUB.scheduleAnnual}
            </p>

            <h3 className="text-xl font-drama font-bold mb-3">
              Member observers
            </h3>
            <p className="text-text/70 leading-relaxed mb-4">
              {BOARD_HUB.scheduleObserver}
            </p>
            <a
              href={`mailto:${BOARD_HUB.observerEmail}`}
              className="text-primary-text font-semibold hover:underline"
            >
              Email {BOARD_HUB.observerEmail}
            </a>
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
