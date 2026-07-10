import React, { useState } from 'react';
import { Quote, Link as LinkIcon, Share2 } from 'lucide-react';
import { pointCitation, pointUrl } from '../lib/cite';
import { copyText, canNativeShare, shareOrCopy } from '../lib/share';

// Action row on a Key Point card: copy the claim with its full citation
// (slide-deck ready), copy a permanent link to the claim, or open the native
// share sheet on devices that have one. `post` must carry title, slug,
// published_at and — when present — source_name/source_url/source_published_at.
export default function KeyPointActions({ point, post }) {
  const [flashed, setFlashed] = useState(null); // 'cite' | 'link' | null

  function flash(kind) {
    setFlashed(kind);
    setTimeout(() => setFlashed(null), 1600);
  }

  const url = pointUrl(post.slug, point.id);
  const btn =
    'inline-flex items-center gap-1 text-xs font-data font-semibold text-text/70 hover:text-primary-text transition-colors';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
      <button
        type="button"
        title="Copy this key point with its source citation"
        onClick={async () => (await copyText(pointCitation(point, post))) && flash('cite')}
        className={btn}
      >
        <Quote className="w-3.5 h-3.5" />
        {flashed === 'cite' ? 'Copied!' : 'Copy citation'}
      </button>
      <button
        type="button"
        title="Copy a permanent link to this key point"
        onClick={async () => (await copyText(url)) && flash('link')}
        className={btn}
      >
        <LinkIcon className="w-3.5 h-3.5" />
        {flashed === 'link' ? 'Copied!' : 'Copy link'}
      </button>
      {canNativeShare() && (
        <button
          type="button"
          title="Share this key point"
          onClick={() => shareOrCopy({ title: post.title, text: point.content, url })}
          className={btn}
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      )}
    </div>
  );
}
