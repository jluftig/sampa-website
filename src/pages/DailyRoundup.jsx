import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { usePageMeta } from '../components/useDailyMeta';
import { dailyNewsTitle, dailyPageRobots, resolveDailyDate } from '../lib/dailyNewsArchive';
import { useDailyRoundups } from '../lib/useDailyRoundups';
import {
  FEATURE_LISTINGS,
  devPreviewFeature,
  featureBySlug,
  previewLeadFromFeature,
} from '../lib/newsFeatures.js';
import NotFound from './NotFound';
import { DailyRoundupPage } from './DailyRoundupPage';

const DESCRIPTION = 'Five short addiction-medicine items, published each weekday by SAMPA.';

const foundersLead = previewLeadFromFeature(
  featureBySlug(FEATURE_LISTINGS, 'founders-jim-anderson-shani-wilson'),
);

export default function DailyRoundup() {
  const { date } = useParams();
  const { search } = useLocation();
  const catalog = useDailyRoundups();
  const resolution = resolveDailyDate(date, catalog);
  const roundup = resolution.roundup;
  const title = roundup ? dailyNewsTitle(roundup.date) : null;
  usePageMeta({
    title: resolution.status === 'not-found' ? null : title,
    path: resolution.status === 'not-found' || !roundup ? null : `/news/daily/${roundup.date}`,
    description: resolution.status === 'not-found' ? null : DESCRIPTION,
    robots: dailyPageRobots(resolution.status),
  });
  const previewFeature = devPreviewFeature(search, import.meta.env.DEV, foundersLead);

  if (resolution.status === 'not-found') return <NotFound />;

  return (
    <DailyRoundupPage
      date={date}
      resolution={resolution}
      catalog={catalog}
      previewFeature={previewFeature}
    />
  );
}
