'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  FolderOpen,
} from 'lucide-react';
import AdminHeader from './AdminHeader';
import { resolvePostImage, SanityImageSource } from '@/sanity/image';

export interface AdminPostListItem {
  _id: string;
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  img?: string;
  coverImage?: SanityImageSource | null;
  excerpt: string;
  _updatedAt?: string;
}

interface AdminPostsListProps {
  initialPosts: AdminPostListItem[];
}

export default function AdminPostsList({ initialPosts }: AdminPostsListProps) {
  const [posts, setPosts] = useState<AdminPostListItem[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const categoriesList = useMemo(() => {
    const existing = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
    return ['All', ...existing];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [posts, selectedCategory, searchQuery]);

  const handleDelete = async (post: AdminPostListItem) => {
    if (!confirm(`Delete "${post.title}"? This removes the article from Sanity permanently.`)) {
      return;
    }

    setDeletingId(post._id);
    try {
      const res = await fetch(`/api/admin/blogs/${encodeURIComponent(post._id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete post');
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      showToast('success', 'Article deleted from Sanity');
    } catch (err) {
      showToast('error', (err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A' }}>
      <AdminHeader />

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '10px',
            background: '#FFFFFF',
            border: `1px solid ${toast.type === 'success' ? '#86EFAC' : '#FECACA'}`,
            color: toast.type === 'success' ? '#166534' : '#B91C1C',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} color="#16A34A" />
          ) : (
            <AlertCircle size={18} color="#DC2626" />
          )}
          {toast.message}
        </div>
      )}

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px 80px' }}>
        {/* Header & Stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '18px',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.65rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Blog Posts
            </h1>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
              Write, edit, upload images, and publish articles directly to Sanity.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={statPill}>
              <FileText size={15} color="#15803D" />
              <span>{posts.length} Articles</span>
            </div>
            <div style={statPill}>
              <FolderOpen size={15} color="#15803D" />
              <span>{Math.max(0, categoriesList.length - 1)} Categories</span>
            </div>

            <Link
              href="/admin/posts/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 18px',
                borderRadius: '9px',
                background: '#15803D',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                boxShadow: '0 2px 6px rgba(21, 128, 61, 0.25)',
              }}
            >
              <Plus size={17} />
              Write New Article
            </Link>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '22px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by title or category..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categoriesList.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: active ? '#15803D' : '#E2E8F0',
                    background: active ? '#DCFCE7' : '#FFFFFF',
                    color: active ? '#15803D' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              borderRadius: '14px',
              background: '#FFFFFF',
              border: '1px dashed #CBD5E1',
              color: '#64748B',
            }}
          >
            <p style={{ fontSize: '0.96rem', marginBottom: '12px' }}>No matching articles found.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredPosts.map((post) => (
              <div
                key={post._id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                }}
              >
                <Link
                  href={`/admin/posts/${post.id}`}
                  style={{ position: 'relative', height: '180px', background: '#F1F5F9', display: 'block' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvePostImage(post)}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(255, 255, 255, 0.94)',
                      color: '#0F172A',
                      border: '1px solid #E2E8F0',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {post.category}
                  </span>
                </Link>

                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginBottom: '6px', fontWeight: 500 }}>
                    {post.date} · {post.author}
                  </div>
                  <Link href={`/admin/posts/${post.id}`} style={{ textDecoration: 'none', color: '#0F172A' }}>
                    <h3
                      style={{
                        margin: '0 0 8px',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        lineHeight: 1.4,
                        color: '#0F172A',
                      }}
                    >
                      {post.title}
                    </h3>
                  </Link>
                  <p
                    style={{
                      margin: '0 0 16px',
                      fontSize: '0.85rem',
                      color: '#475569',
                      lineHeight: 1.5,
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.excerpt}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      paddingTop: '12px',
                      borderTop: '1px solid #F1F5F9',
                    }}
                  >
                    <Link
                      href={`/admin/posts/${post.id}`}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        color: '#0F172A',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      <Edit3 size={14} />
                      Edit Article
                    </Link>

                    <Link
                      href={`/blog/${post.id}`}
                      target="_blank"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        color: '#475569',
                      }}
                      title="View Live"
                    >
                      <ExternalLink size={14} />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(post)}
                      disabled={deletingId === post._id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        cursor: 'pointer',
                      }}
                      title="Delete Post"
                    >
                      {deletingId === post._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const statPill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  padding: '8px 12px',
  borderRadius: '8px',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#334155',
};
