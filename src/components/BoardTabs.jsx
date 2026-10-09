import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { visibleBoardTabs } from '../lib/boardNav';

export default function BoardTabs({ active }) {
  const { profile } = useAuth();
  const tabs = visibleBoardTabs(profile);
  if (tabs.length < 2) return null;

  return (
    <nav aria-label="Board" className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={selected ? 'page' : undefined}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              selected
                ? 'bg-primary-text text-white'
                : 'bg-white border border-primary/15 text-text/70 hover:border-primary/40'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
