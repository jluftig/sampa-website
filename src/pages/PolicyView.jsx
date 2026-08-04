import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import DOMPurify from 'dompurify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  getPolicyDocument,
  typeLabel,
  POLICY_HUB,
} from '../data/policyDocuments';
import { formatDateOnly } from '../lib/format';

export default function PolicyView() {
  const { slug } = useParams();
  const doc = getPolicyDocument(slug);

  if (!doc) {
    return (
      <div className="relative min-h-screen bg-background text-text">
        <div className="noise-overlay pointer-events-none" />
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-32 pb-24 text-center">
          <h1 className="text-3xl font-drama font-bold mb-4">Not found</h1>
          <p className="text-text/60 mb-8">
            That policy document isn’t on the site (or the link is outdated).
          </p>
          <Link to="/policy" className="text-primary-text font-semibold hover:underline">
            ← Back to Policy
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const safeBody = doc.bodyHtml
    ? DOMPurify.sanitize(doc.bodyHtml, { USE_PROFILES: { html: true } })
    : '';

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <Link
          to="/policy"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text/50 hover:text-primary-text transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Policy
        </Link>

        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary-text text-xs font-semibold font-data uppercase tracking-wider">
              {typeLabel(doc.type)}
            </span>
            {doc.onBehalfOfMembers && (
              <span className="text-xs font-data uppercase tracking-wider text-text/45">
                Prepared on behalf of SAMPA members
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-drama font-bold leading-tight mb-6">
            {doc.title}
          </h1>
          <dl className="grid gap-2 text-sm text-text/60">
            {doc.agency && (
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-semibold text-text/80">Agency</dt>
                <dd>{doc.agency}</dd>
              </div>
            )}
            {doc.docket && (
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-semibold text-text/80">Docket</dt>
                <dd>{doc.docket}</dd>
              </div>
            )}
            {doc.submittedAt && (
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-semibold text-text/80">Submitted</dt>
                <dd>{formatDateOnly(doc.submittedAt)}</dd>
              </div>
            )}
          </dl>
        </header>

        <p className="text-lg text-text/75 leading-relaxed mb-10">
          {doc.summary}
        </p>

        {doc.pdfUrl && (
          <a
            href={doc.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white rounded-3xl border border-primary/15 px-6 py-5 mb-12 hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-primary-text" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-text group-hover:text-primary-text transition-colors">
                Official PDF
              </div>
              <div className="text-sm text-text/50">
                Full submitted document (download or open)
              </div>
            </div>
            <Download className="w-5 h-5 text-primary-text shrink-0" />
          </a>
        )}

        {doc.themes?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-drama font-bold mb-4">Key themes</h2>
            <ul className="space-y-3">
              {doc.themes.map((theme) => (
                <li
                  key={theme}
                  className="flex gap-3 text-text/75 leading-relaxed"
                >
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>{theme}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {safeBody && (
          <section
            className="prose prose-lg max-w-none text-text/80 mb-16
              prose-headings:font-drama prose-headings:text-text
              prose-a:text-primary-text"
            dangerouslySetInnerHTML={{ __html: safeBody }}
          />
        )}

        <p className="text-sm text-text/45 leading-relaxed border-t border-text/10 pt-8">
          {POLICY_HUB.disclaimer}
        </p>
      </main>

      <Footer />
    </div>
  );
}
