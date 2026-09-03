import React, { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Download, FileText, MapPin } from 'lucide-react';
import DOMPurify from 'dompurify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  BOARD_HUB,
  getBoardMeeting,
  kindLabel,
  meetingStatusLabel,
  docStatusLabel,
  hasFullBody,
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

function DocumentSection({ id, heading, doc, emptyCopy }) {
  const safeBody = doc.bodyHtml
    ? DOMPurify.sanitize(doc.bodyHtml, { USE_PROFILES: { html: true } })
    : '';
  const postedPdf = Boolean(doc.pdfUrl && (doc.status === 'posted' || doc.status === 'on_file'));

  return (
    <section id={id} className="mb-12 scroll-mt-32" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="text-xl font-drama font-bold mb-4">
        {heading}
      </h2>

      {postedPdf && (
        <a
          href={doc.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-white rounded-3xl border border-primary/15 px-6 py-5 mb-6 hover:border-primary/40 hover:shadow-md transition-all group"
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
      )}

      {safeBody ? (
        <div
          className="prose prose-lg max-w-none text-text/80 bg-white rounded-3xl border border-primary/10 px-6 py-6
            prose-headings:font-drama prose-headings:text-text
            prose-a:text-primary-text"
          dangerouslySetInnerHTML={{ __html: safeBody }}
        />
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

      {hasFullBody(doc) && doc.approvedAt && !postedPdf && (
        <p className="text-sm text-text/45 mt-3">
          Approved {formatDateOnly(doc.approvedAt)}
        </p>
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

        <DocumentSection
          id="agenda"
          heading="Agenda"
          doc={meeting.agenda}
          emptyCopy="No agenda is listed for this meeting."
        />

        <DocumentSection
          id="minutes"
          heading="Minutes"
          doc={meeting.minutes}
          emptyCopy="Minutes are not posted yet. Draft minutes are not published."
        />

        <p className="text-sm text-text/45 leading-relaxed border-t border-text/10 pt-8">
          {BOARD_HUB.disclaimer}
        </p>
      </main>

      <Footer />
    </div>
  );
}
