import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  POLICY_HUB,
  POLICY_TYPES,
  listPolicyDocuments,
  typeLabel,
} from '../data/policyDocuments';
import { formatDateOnly } from '../lib/format';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'comment', label: POLICY_TYPES.comment.label },
  { key: 'position', label: POLICY_TYPES.position.label },
  { key: 'statement', label: POLICY_TYPES.statement.label },
];

export default function Policy() {
  const docs = useMemo(() => listPolicyDocuments(), []);
  const [filter, setFilter] = useState('all');

  const visible = filter === 'all' ? docs : docs.filter((d) => d.type === filter);
  const featured = docs[0] || null;

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 pt-32 pb-24">
        <header className="max-w-3xl mb-16 md:mb-20">
          <div className="text-primary-text font-bold font-data tracking-widest text-sm mb-4 uppercase">
            {POLICY_HUB.eyebrow}
          </div>
          <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">
            {POLICY_HUB.title}
          </h1>
          <p className="text-xl text-text/70 leading-relaxed">
            {POLICY_HUB.oneLiner}
          </p>
          {featured && (
            <Link
              to={`/policy/${featured.slug}`}
              className="inline-flex items-center gap-2 mt-8 text-primary-text font-semibold hover:underline"
            >
              Read our latest public comment
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </header>

        {featured && (
          <section className="mb-16 md:mb-20">
            <Link
              to={`/policy/${featured.slug}`}
              className="group block bg-white rounded-4xl border border-primary/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-8 md:p-12"
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary-text text-xs font-semibold font-data uppercase tracking-wider">
                  {typeLabel(featured.type)}
                </span>
                {featured.agency && (
                  <span className="text-sm text-text/50 font-data">
                    {featured.agency}
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-drama font-bold text-text group-hover:text-primary-text transition-colors mb-4 leading-snug">
                {featured.title}
              </h2>
              <p className="text-lg text-text/70 leading-relaxed max-w-3xl mb-6">
                {featured.summary}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-text/50">
                {featured.submittedAt && (
                  <span>
                    Submitted {formatDateOnly(featured.submittedAt)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-primary-text font-semibold group-hover:underline">
                  View comment
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </section>
        )}

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-2xl font-drama font-bold">All materials</h2>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    filter === f.key
                      ? 'bg-primary-text text-white'
                      : 'bg-white border border-primary/15 text-text/70 hover:border-primary/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="text-center bg-white rounded-4xl border border-primary/10 p-16 max-w-2xl mx-auto">
              <FileText className="w-10 h-10 text-primary/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Nothing in this category yet</h3>
              <p className="text-text/60">
                Check back as SAMPA publishes additional positions and comments.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {visible.map((doc) => (
                <li key={doc.slug}>
                  <Link
                    to={`/policy/${doc.slug}`}
                    className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 bg-white rounded-3xl border border-primary/10 px-6 py-5 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <span className="shrink-0 px-3 py-1 rounded-full bg-primary/10 text-primary-text text-xs font-semibold font-data uppercase tracking-wider w-fit">
                      {typeLabel(doc.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text leading-snug mb-1">
                        {doc.title}
                      </h3>
                      {doc.agency && (
                        <p className="text-sm text-text/50 truncate">{doc.agency}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm text-text/45 font-data">
                      {formatDateOnly(doc.publishedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-20 text-sm text-text/45 max-w-2xl leading-relaxed">
          {POLICY_HUB.disclaimer}
        </p>
      </main>

      <Footer />
    </div>
  );
}
