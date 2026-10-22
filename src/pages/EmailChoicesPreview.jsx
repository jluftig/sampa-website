import React, { useState } from 'react';
import { EmailChoiceList } from './EmailChoices';
import { resolveEmailLists, shapeEmailPreferences } from '../lib/emailLists';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const sample = shapeEmailPreferences({
  lists: resolveEmailLists({
    BREVO_LIST_UPDATES: '3',
    BREVO_LIST_DAILY_NEWS: '15',
    BREVO_LIST_WEEKLY_TOPIC: '42',
  }),
  listIds: [3],
  emailBlacklisted: false,
});

export default function EmailChoicesPreview() {
  const [state, setState] = useState(sample);
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 pt-32 pb-24">
        <h1 className="text-3xl font-sans tracking-tight font-bold mb-8">
          Choose which SAMPA emails you get
        </h1>
        <EmailChoiceList
          lists={state.lists}
          emailBlacklisted={state.emailBlacklisted}
          pendingKey=""
          error=""
          onToggle={(list) => {
            setState({
              ...state,
              lists: state.lists.map((item) => (
                item.key === list.key ? { ...item, subscribed: !item.subscribed } : item
              )),
            });
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
