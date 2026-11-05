import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  FEATURE_LISTINGS,
  devAsOfDay,
  featureBySlug,
  isFeatureVisible,
} from '../lib/newsFeatures.js';
import { FeatureArticlePage } from './FeatureArticlePage';

export default function FeatureArticle() {
  const { slug } = useParams();
  const { search } = useLocation();
  const asOfDay = devAsOfDay(search, import.meta.env.DEV);
  const listing = featureBySlug(FEATURE_LISTINGS, slug);
  const visible = isFeatureVisible(listing, new Date(), asOfDay);
  const [modules, setModules] = useState(null);

  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    import('../lib/newsFeatureCatalog.js').then((mod) => {
      if (active) setModules(mod.default);
    });
    return () => { active = false; };
  }, [visible]);

  if (!visible) {
    return <FeatureArticlePage slug={slug} modules={{}} asOfDay={asOfDay} />;
  }

  if (!modules) {
    return (
      <div className="relative min-h-screen bg-background text-text">
        <div className="noise-overlay pointer-events-none"></div>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-32">
          <p className="mt-16 text-center font-data text-text/50">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <FeatureArticlePage
      slug={slug}
      modules={modules}
      asOfDay={asOfDay}
    />
  );
}
