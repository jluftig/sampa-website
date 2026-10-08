import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiGet } from '../lib/api';
import { BOARD_HUB } from '../data/boardHub';
import {
  hasListedDoc,
  nextStandingBoardDates,
  recordsEmptyCopy,
} from '../data/boardSchedule';
import BoardNumbers from '../components/BoardNumbers';

const TABS = [
  { id: 'agendas', label: 'Board Meeting Agendas' },
  { id: 'records', label: 'Board Meeting Records' },
  { id: 'schedule', label: 'Board Meeting Schedule' },
];

function tabFromHash(hash) {
  const id = (hash || '').replace('#', '');
  return TABS.some((tab) => tab.id === id) ? id : 'agendas';
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

const rowClass = 'block bg-white rounded-3xl border border-primary/10 px-6 py-5 font-bold text-text leading-snug';
const linkClass = `${rowClass} hover:border-primary/30 hover:shadow-md transition-all`;

function DateRow({ to, children }) {
  if (to) {
    return (
      <Link to={to} className={linkClass}>
        {children}
      </Link>
    );
  }
  return <div className={rowClass}>{children}</div>;
}

export default function BoardMeetings() {
  const [meetings, setMeetings] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const { hash } = useLocation();
  const navigate = useNavigate();
  const tab = tabFromHash(hash);

  useEffect(() => {
    let cancelled = false;
    apiGet('/api/board-meetings')
      .then((data) => {
        if (!cancelled) setMeetings(data.meetings || []);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const agendas = useMemo(
    () => (meetings || []).filter((meeting) => hasListedDoc(meeting.agenda)),
    [meetings],
  );
  const records = useMemo(
    () => (meetings || []).filter((meeting) => hasListedDoc(meeting.minutes)),
    [meetings],
  );
  const standing = useMemo(
    () => nextStandingBoardDates(2, new Date(), meetings || []),
    [meetings],
  );
  const recordsEmpty = recordsEmptyCopy(meetings ? records : null);

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

        <BoardNumbers />

        <div
          role="tablist"
          aria-label="Board of Directors Meetings and Meeting Records"
          className="flex flex-wrap gap-2 mb-8"
        >
          {TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`board-tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`board-panel-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  selected
                    ? 'bg-primary-text text-white'
                    : 'bg-white border border-primary/15 text-text/70 hover:border-primary/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {loadError && (
          <p className="text-text/70 mb-8" role="status">
            {loadError.status === 401
              ? 'Sign in required.'
              : loadError.status === 403
                ? 'Active membership required.'
                : 'Board meetings could not be loaded.'}
          </p>
        )}

        {!loadError && !meetings && (
          <p className="text-text/50 font-data mb-8">Loading…</p>
        )}

        {tab === 'agendas' && meetings && (
          <section
            role="tabpanel"
            id="board-panel-agendas"
            aria-labelledby="board-tab-agendas"
          >
            <ul className="space-y-4">
              {agendas.map((meeting) => (
                <li key={`${meeting.slug}-agenda`}>
                  <DateRow to={`/board/${meeting.slug}#agenda`}>
                    {meeting.agendaListTitle}
                  </DateRow>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'records' && meetings && (
          <section
            role="tabpanel"
            id="board-panel-records"
            aria-labelledby="board-tab-records"
          >
            <p className="text-text/70 leading-relaxed max-w-3xl mb-8">
              {BOARD_HUB.recordsIntro}
            </p>
            {recordsEmpty ? (
              <p className="text-text/60">{recordsEmpty}</p>
            ) : (
              <ul className="space-y-4">
                {records.map((meeting) => (
                  <li key={`${meeting.slug}-minutes`}>
                    <DateRow to={`/board/${meeting.slug}#minutes`}>
                      {meeting.recordListTitle}
                    </DateRow>
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
