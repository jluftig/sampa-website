import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  meetingStatusLabel,
  docStatusLabel,
  hasFullBody,
  hasListedDoc,
} from '../data/boardMeetings';
import { formatDateOnly } from '../lib/format';

function meetingWhen(meeting) {
  if (meeting.date) {
    const start = formatDateOnly(meeting.date);
    return meeting.time ? `${start} · ${meeting.time}` : start;
  }
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

export default function BoardMeetings() {
  const meetings = useMemo(() => listBoardMeetings(), []);
  const upcoming = useMemo(() => upcomingMeetings(meetings), [meetings]);
  const agendas = useMemo(() => meetingsWithAgenda(meetings), [meetings]);
  const records = useMemo(() => meetingsWithMinutes(meetings), [meetings]);
  const nextUp = upcoming[0] || null;

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 pt-32 pb-24">
        <header className="max-w-3xl mb-16 md:mb-20">
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
          <section className="mb-16 md:mb-20" aria-labelledby="next-heading">
            <h2 id="next-heading" className="text-2xl md:text-3xl font-drama font-bold mb-8">
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

        <section id="schedule" className="mb-16 md:mb-20 scroll-mt-32" aria-labelledby="schedule-heading">
          <h2 id="schedule-heading" className="text-2xl md:text-3xl font-drama font-bold mb-4">
            Meeting list
          </h2>
          <p className="text-lg text-text/70 leading-relaxed max-w-3xl mb-8">
            Newest first. Open a meeting for its agenda and minutes.
          </p>
          <div className="overflow-x-auto rounded-3xl border border-primary/10 bg-white">
            <table className="w-full min-w-[44rem] text-left text-sm md:text-base">
              <caption className="sr-only">
                SAMPA Board meetings, newest first
              </caption>
              <thead>
                <tr className="border-b border-primary/10 bg-primary/5">
                  <th scope="col" className="px-5 py-4 font-semibold text-text">Meeting</th>
                  <th scope="col" className="px-5 py-4 font-semibold text-text">When</th>
                  <th scope="col" className="px-5 py-4 font-semibold text-text">Agenda</th>
                  <th scope="col" className="px-5 py-4 font-semibold text-text">Minutes</th>
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
                        {meeting.title}
                      </Link>
                      <div className="font-normal text-sm text-text/50 mt-1">
                        {kindLabel(meeting.kind)} · {formatLabel(meeting.format)}
                      </div>
                    </th>
                    <td className="px-5 py-4 text-text/70">{meetingWhen(meeting)}</td>
                    <td className="px-5 py-4">
                      <StatusChip tone={docTone(meeting.agenda)}>
                        {docStatusLabel(meeting.agenda.status)}
                      </StatusChip>
                    </td>
                    <td className="px-5 py-4">
                      <StatusChip tone={docTone(meeting.minutes)}>
                        {docStatusLabel(meeting.minutes.status)}
                      </StatusChip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="agendas" className="mb-16 md:mb-20 scroll-mt-32" aria-labelledby="agendas-heading">
          <h2 id="agendas-heading" className="text-2xl md:text-3xl font-drama font-bold mb-4">
            Agendas
          </h2>
          <p className="text-lg text-text/70 leading-relaxed max-w-3xl mb-8">
            Posted agendas are on the meeting page. Months marked on file are
            in the Board Meetings Drive and will get full text here next.
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
                    <h3 className="font-bold text-text leading-snug mb-1">{meeting.title}</h3>
                    <p className="text-sm text-text/50">{meetingWhen(meeting)}</p>
                  </div>
                  <span className="shrink-0 text-sm text-text/45 font-data">
                    {docStatusLabel(meeting.agenda.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="records" className="scroll-mt-32" aria-labelledby="records-heading">
          <h2 id="records-heading" className="text-2xl md:text-3xl font-drama font-bold mb-4">
            Meeting records
          </h2>
          <p className="text-lg text-text/70 leading-relaxed max-w-3xl mb-8">
            Approved minutes and other records. July 2026 is posted in full.
            Other months on file will get their bodies pasted next.
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
                      <h3 className="font-bold text-text leading-snug mb-1">{meeting.title}</h3>
                      <p className="text-sm text-text/50">{meetingWhen(meeting)}</p>
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

        <p className="mt-20 text-sm text-text/45 max-w-2xl leading-relaxed">
          {BOARD_HUB.disclaimer}
        </p>
      </main>

      <Footer />
    </div>
  );
}
