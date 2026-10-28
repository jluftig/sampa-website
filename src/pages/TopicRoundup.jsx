import React from 'react';
import { useParams } from 'react-router-dom';
import topicModules from '../lib/topicRoundupCatalog.js';
import { TopicRoundupPage } from './TopicRoundupPage';

export default function TopicRoundup() {
  const { date } = useParams();
  return <TopicRoundupPage date={date} modules={topicModules} />;
}
