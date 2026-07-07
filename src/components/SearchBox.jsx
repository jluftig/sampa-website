import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

// Small search form that routes to /search?q=… Used on News, Keywords, and the
// search page itself (remount with key={q} to pick up a new URL query).
export default function SearchBox({ placeholder = 'Search news and key points…', initial = '', autoFocus = false }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();

  function onSubmit(e) {
    e.preventDefault();
    const query = q.trim();
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text/40 pointer-events-none" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-11 pr-4 py-3 rounded-full border border-primary/20 bg-white focus:outline-none focus:border-primary text-sm"
      />
    </form>
  );
}
