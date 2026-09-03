import React, { Fragment, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
} from '../data/boardMeetings';

const TABS = [
  { id: 'agendas', label: 'Board Meeting Agendas' },
  { id: 'records', label: 'Board Meeting Records' },
  { id: 'schedule', label: 'Board Meeting Schedule' },
];

function tabFromHash(hash) {
  const id = (hash || '').replace('#', '');
  return TABS.some((t) => t.id === id) ? id : 'agendas';
}

function CopyWithObserverEmail({ text }) {
  const email = BOARD_HUB.observerEmail;
  const parts = String(text || '').split(email);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={`${email}-${i}`}>
          {part}
          {i < parts.length - 1 && (
            <a
              href={`mailto:${email}`}
              className="text-primary-text font-semibold hover:underline"
            >
              {email}
            </a>
          )}
        </Fragment>
      ))}
    </>
  );
}

function DateRow({ to, children }) {
  const className =
    'block bg-white rounded-3xl border border-primary/10 px-6 py-5 hover:border-primary/30 hover:shadow-md transition-all font-bold text-text leading-snug';
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
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
        <header className="max-w-4xl mb-10 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-drama font-bold">
            {BOARD_HUB.title}
          </h1>
        </header>

        <div
          role="tablist"
          aria-label="Board of Directors Meetings and Meeting Records"
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
            <ul className="space-y-4">
              {agendas.map((meeting) => (
                <li key={`${meeting.slug}-agenda`}>
                  <DateRow to={`/board/${meeting.slug}#agenda`}>
                    {agendaListTitle(meeting)}
                  </DateRow>
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
            <p className="text-text/70 leading-relaxed max-w-3xl mb-8">
              {BOARD_HUB.recordsIntro}
            </p>
            <ul className="space-y-4">
              {records.map((meeting) => (
                <li key={`${meeting.slug}-minutes`}>
                  <DateRow to={`/board/${meeting.slug}#minutes`}>
                    {recordListTitle(meeting)}
                  </DateRow>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'schedule' && (
          <section
            role="tabpanel"
            id="board-panel-schedule"
            aria-labelledby="board-tab-schedule"
            className="max-w-3xl"
          >
            <p className="text-text/70 leading-relaxed mb-8">
              <CopyWithObserverEmail text={BOARD_HUB.scheduleIntro} />
            </p>
            <ul className="space-y-4">
              <li>
                <DateRow>
                  Standing Board meetings: every second Wednesday, 8:00 PM ET, virtual
                </DateRow>
              </li>
              {standing.map((row) => (
                <li key={row.date}>
                  <DateRow to={row.slug ? `/board/${row.slug}` : null}>
                    {row.dateLabel} Board Meeting
                  </DateRow>
                </li>
              ))}
              <li>
                <DateRow>Annual Membership Meeting: TBD, Q2 2027</DateRow>
              </li>
            </ul>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
