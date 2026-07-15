import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { slugify } from '../lib/slug';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Admin-only management of the controlled keyword vocabulary. Keyword slugs are
// the permanent identifier used in URLs, so they're set once at creation and not
// editable here (name + short label can change freely).
export default function AdminTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [newShort, setNewShort] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tags')
      .select('id, name, short_label, slug')
      .order('name');
    if (error) setError(error.message);
    else setTags(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addTag() {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from('tags').insert({
      name: newName.trim(),
      short_label: newShort.trim() || newName.trim(),
      slug: slugify(newName),
    });
    if (error) {
      setError(error.code === '23505' ? 'A tag with that name/slug already exists.' : error.message);
    } else {
      setNewName('');
      setNewShort('');
      await load();
    }
    setBusy(false);
  }

  async function saveTag(tag) {
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from('tags')
      .update({ name: tag.name.trim(), short_label: tag.short_label?.trim() || tag.name.trim() })
      .eq('id', tag.id);
    if (error) setError(error.message);
    await load();
    setBusy(false);
  }

  async function deleteTag(tag) {
    if (!window.confirm(`Delete the "${tag.name}" keyword? It will be removed from every key point that uses it.`)) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from('tags').delete().eq('id', tag.id);
    if (error) setError(error.message);
    await load();
    setBusy(false);
  }

  function updateLocal(id, field, value) {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-40 pb-24">
        <Link to="/editor" className="text-primary-text font-data text-sm font-semibold hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-drama font-bold mt-4 mb-2">Manage keywords</h1>
        <p className="text-text/60 mb-8">
          The controlled vocabulary editors choose from. <strong>Name</strong> shows on keyword pages;
          <strong> short label</strong> is the compact chip inside posts (e.g. OUD).
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Add a new tag */}
        <div className="bg-white rounded-2xl border border-primary/10 p-5 mb-8">
          <h2 className="font-bold mb-3">Add a keyword</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold mb-1">Full name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Opioid Use Disorder"
                className="w-full px-3 py-2 rounded-xl border border-primary/20 focus:outline-none focus:border-primary" />
            </div>
            <div className="w-32">
              <label className="block text-xs font-semibold mb-1">Short label</label>
              <input value={newShort} onChange={(e) => setNewShort(e.target.value)}
                placeholder="OUD"
                className="w-full px-3 py-2 rounded-xl border border-primary/20 focus:outline-none focus:border-primary font-data text-sm" />
            </div>
            <button onClick={addTag} disabled={busy || !newName.trim()}
              className="bg-accent text-white px-5 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              Add
            </button>
          </div>
          {newName && <p className="text-text/40 text-xs mt-2 font-data">slug: {slugify(newName) || '…'}</p>}
        </div>

        {/* Existing tags */}
        {loading ? (
          <p className="text-text/50 font-data">Loading…</p>
        ) : (
          <div className="bg-white rounded-2xl border border-primary/10 divide-y divide-primary/10">
            {tags.map((tag) => (
              <div key={tag.id} className="flex flex-wrap items-end gap-3 p-4">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-semibold mb-1 text-text/50">Name</label>
                  <input value={tag.name} onChange={(e) => updateLocal(tag.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary/20 focus:outline-none focus:border-primary" />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-semibold mb-1 text-text/50">Short</label>
                  <input value={tag.short_label || ''} onChange={(e) => updateLocal(tag.id, 'short_label', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary/20 focus:outline-none focus:border-primary font-data text-sm" />
                </div>
                <div className="text-text/40 text-xs font-data pb-2.5 w-full sm:w-auto">/{tag.slug}</div>
                <button onClick={() => saveTag(tag)} disabled={busy}
                  className="px-4 py-2 rounded-full border border-primary/20 text-sm font-semibold hover:bg-primary-text hover:text-white transition-colors disabled:opacity-50">
                  Save
                </button>
                <button onClick={() => deleteTag(tag)} disabled={busy}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
