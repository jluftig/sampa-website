import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/format';

// A single post preview card, used in the News list and the homepage teaser.
export default function PostCard({ post }) {
  return (
    <Link
      to={`/news/${post.slug}`}
      className="group block bg-white rounded-4xl shadow-sm border border-primary/10 overflow-hidden hover:shadow-lg transition-all text-left"
    >
      {post.cover_image_url ? (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={post.cover_image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-accent/10" />
      )}

      <div className="p-6 md:p-8">
        <div className="text-primary font-bold font-data tracking-widest text-xs mb-3 uppercase">
          {formatDate(post.published_at)}
        </div>
        <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-text/60 line-clamp-3">{post.excerpt}</p>
        )}
      </div>
    </Link>
  );
}
