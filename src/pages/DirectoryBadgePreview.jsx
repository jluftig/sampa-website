import React from 'react';
import { DirectoryBadges } from '../components/DirectoryBadges';

const ROWS = [
  { title: 'Patron and Donor', person: { patron: true, donor: true } },
  { title: 'Patron only', person: { patron: true } },
  { title: 'Donor only', person: { donor: true } },
  { title: 'Board, Patron, and Donor', person: { is_board: true, patron: true, donor: true } },
  { title: 'No badge', person: {} },
];

export default function DirectoryBadgePreview() {
  return (
    <main className="min-h-screen bg-background text-text p-6">
      <h1 className="text-2xl font-bold mb-6">Directory badges</h1>
      <div className="space-y-4 max-w-xl">
        {ROWS.map((row) => (
          <section key={row.title} className="flex items-center gap-4 border border-primary-text/10 rounded-lg px-4 py-3">
            <span className="w-56 text-sm">{row.title}</span>
            <DirectoryBadges person={row.person} size="md" />
          </section>
        ))}
      </div>
    </main>
  );
}
