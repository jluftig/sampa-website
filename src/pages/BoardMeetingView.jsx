import React, { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Download, FileText, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  BOARD_HUB,
  STANDING_AGENDA_ITEMS,
  getBoardMeeting,
  kindLabel,
  meetingStatusLabel,
  docStatusLabel,
  hasPostedDoc,
} from '../data/boardMeetings';
import { formatDateOnly } from '../lib/format';

function meetingWhen(meeting) {
  if (meeting.date) {
    const start = formatDateOnly(meeting.date);
    if (meeting.endDate && meeting.endDate !== meeting.date) {
      return `${start} – ${formatDateOnly(meeting.endDate)}`;
    }
    return start;
  }
  return meeting.dateLabel || 'Date to be announced';
}

function formatLabel(format) {
  if (format === 'in-person') return 'In person';
  if (format === 'hybrid') return 'Hybrid';
  return 'Virtual';
}

function DocumentCard({ id, heading, doc, emptyCopy }) {
  const posted = hasPostedDoc(doc);
  return (
    <section id={id} className="mb-12 scroll-mt-32" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="text-xl font-drama font-bold mb-4">
        {heading}
      </h2>
      {posted ? (
        <a
          href={doc.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-white rounded-3xl border border-primary/15 px-6 py-5 hover:border-primary/40 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-primary-text" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-text group-hover:text-primary-text transition-colors">
              {doc.label || heading}
            </div>
            <div className="text-sm text-text/50">
              Official PDF (download or open)
              {doc.approvedAt ? ` · Approved ${formatDateOnly(doc.approvedAt)}` : ''}
            </div>
          </div>
          <Download className="w-5 h-5 text-primary-text shrink-0" />
        </a>
      ) : (
        <div className="flex items-start gap-4 bg-white rounded-3xl border border-primary/10 px-6 py-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-primary-text" />
          </div>
          <div>
            <div className="font-bold text-text mb-1">{doc.label || heading}</div>
            <p className="text-sm text-text/60 leading-relaxed">
              {emptyCopy}{' '}
              <span className="font-data uppercase tracking-wider text-xs text-text/45">
                {docStatusLabel(doc.status)}
              </span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default function BoardMeetingView() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const meeting = getBoardMeeting(slug);

  useEffect(() => {
    if (!hash) return undefined;
    const id = hash.replace('#', '');
    const el = document.getElementById(id);
    if (!el) return undefined;
    const t = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(t);
  }, [hash, meeting]);

  if (!meeting) {
    return (
      <div className="relative min-h-screen bg-background text-text">
        <div className="noise-overlay pointer-events-none" />
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-32 pb-24 text-center">
          <h1 className="text-3xl font-drama font-bold mb-4">Not found</h1>
          <p className="text-text/60 mb-8">
            That Board meeting isn’t on the site (or the link is outdated).
          </p>
          <Link to="/board" className="text-primary-text font-semibold hover:underline">
            ← Back to Board meetings
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <Link
          to="/board"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text/50 hover:text-primary-text transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Board meetings
        </Link>

        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary-text text-xs font-semibold font-data uppercase tracking-wider">
              {meetingStatusLabel(meeting.status)}
            </span>
            <span className="text-xs font-data uppercase tracking-wider text-text/45">
              {kindLabel(meeting.kind)}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-drama font-bold leading-tight mb-6">
            {meeting.title}
          </h1>
          <dl className="grid gap-2 text-sm text-text/60">
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="font-semibold text-text/80 inline-flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                When
              </dt>
              <dd>
                {meetingWhen(meeting)} · {formatLabel(meeting.format)}
              </dd>
            </div>
            {meeting.location && (
              <div className="flex flex-wrap items-center gap-x-2">
                <dt className="font-semibold text-text/80 inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Where
                </dt>
                <dd>{meeting.location}</dd>
              </div>
            )}
          </dl>
        </header>

        {meeting.summary && (
          <p className="text-lg text-text/75 leading-relaxed mb-10">{meeting.summary}</p>
        )}

        <DocumentCard
          id="agenda"
          heading="Agenda"
          doc={meeting.agenda}
          emptyCopy="The agenda PDF will appear here when the Board posts it. Until then, the standing outline below is the usual order of business."
        />

        {!hasPostedDoc(meeting.agenda) && (
          <section className="mb-12" aria-labelledby="outline-heading">
            <h2 id="outline-heading" className="text-xl font-drama font-bold mb-4">
              Standing outline
            </h2>
            <ul className="space-y-3">
              {STANDING_AGENDA_ITEMS.map((item) => (
                <li key={item} className="flex gap-3 text-text/75 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DocumentCard
          id="minutes"
          heading="Minutes"
          doc={meeting.minutes}
          emptyCopy="Approved minutes are posted after a later meeting accepts them. Draft minutes are not published."
        />

        {meeting.records?.length > 0 && (
          <section id="other-records" className="mb-12 scroll-mt-32" aria-labelledby="other-records-heading">
            <h2 id="other-records-heading" className="text-xl font-drama font-bold mb-4">
              Other records
            </h2>
            <ul className="space-y-3">
              {meeting.records.map((rec) => (
                <li key={rec.pdfUrl}>
                  <a
                    href={rec.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-primary-text font-semibold hover:underline"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    {rec.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-sm text-text/45 leading-relaxed border-t border-text/10 pt-8">
          {BOARD_HUB.disclaimer}
        </p>
      </main>

      <Footer />
    </div>
  );
}
