import React from 'react';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/adminAuth';
import { client } from '@/sanity/client';
import { blogsData } from '@/data/blogs';
import AdminPostsList, { AdminPostListItem } from './components/AdminPostsList';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect('/admin/login');
  }

  let posts: AdminPostListItem[] = [];
  try {
    posts = await client.fetch<AdminPostListItem[]>(
      `*[_type == "post"] | order(_createdAt desc) {
        _id,
        title,
        "id": slug.current,
        category,
        date,
        author,
        img,
        coverImage,
        excerpt,
        _updatedAt
      }`
    );
  } catch (err) {
    console.warn('Admin fetch failed, using fallback:', (err as Error).message);
  }

  if (!posts || posts.length === 0) {
    posts = blogsData.map((b) => ({
      ...b,
      _id: `post-${b.id}`,
    }));
  }

  return <AdminPostsList initialPosts={posts} />;
}
