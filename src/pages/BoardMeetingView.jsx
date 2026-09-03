import React, { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import DOMPurify from 'dompurify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  BOARD_HUB,
  getBoardMeeting,
  agendaListTitle,
  hasFullBody,
} from '../data/boardMeetings';
import { formatDateOnly } from '../lib/format';

function DocumentSection({ id, heading, doc }) {
  const safeBody = doc.bodyHtml
    ? DOMPurify.sanitize(doc.bodyHtml, { USE_PROFILES: { html: true } })
    : '';
  const postedPdf = Boolean(doc.pdfUrl && (doc.status === 'posted' || doc.status === 'on_file'));
  if (!safeBody && !postedPdf) return null;

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
              Official PDF
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
      ) : null}

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
          <Link to="/board" className="text-primary-text font-semibold hover:underline">
            ← {BOARD_HUB.title}
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
          {BOARD_HUB.title}
        </Link>

        <h1 className="text-3xl md:text-4xl font-drama font-bold leading-tight mb-10">
          {agendaListTitle(meeting)}
        </h1>

        <DocumentSection id="agenda" heading="Agenda" doc={meeting.agenda} />
        <DocumentSection id="minutes" heading="Minutes" doc={meeting.minutes} />
      </main>

      <Footer />
    </div>
  );
}
