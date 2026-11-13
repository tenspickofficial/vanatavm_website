import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/adminAuth';
import { client } from '@/sanity/client';
import { blogsData } from '@/data/blogs';
import { portableTextToContentBlocks, PortableTextBlock } from '@/lib/portableTextUtils';
import PostEditor, { EditorPostData } from '../../components/PostEditor';

export const dynamic = 'force-dynamic';

interface SanityRawPost extends EditorPostData {
  body?: PortableTextBlock[];
}

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect('/admin/login');
  }

  const { id } = await params;

  let fetchedPost: SanityRawPost | null = null;
  try {
    fetchedPost = await client.fetch<SanityRawPost | null>(
      `*[_type == "post" && (slug.current == $id || _id == $id)][0] {
        _id,
        title,
        "id": slug.current,
        category,
        date,
        author,
        img,
        coverImage,
        excerpt,
        contentBlocks,
        body
      }`,
      { id }
    );
  } catch (err) {
    console.warn('Sanity fetch failed in EditPostPage:', (err as Error).message);
  }

  let post: SanityRawPost;
  if (fetchedPost) {
    post = fetchedPost;
  } else {
    const local = blogsData.find((b) => b.id === id);
    if (!local) {
      notFound();
    }
    post = {
      _id: `post-${local.id}`,
      id: local.id,
      title: local.title,
      category: local.category,
      date: local.date,
      author: local.author,
      img: local.img,
      coverImage: local.coverImage,
      excerpt: local.excerpt,
      contentBlocks: local.contentBlocks,
    };
  }

  // If post only has Portable Text `body` (e.g. created in Sanity Cloud) and no `contentBlocks`, convert it
  if ((!post.contentBlocks || post.contentBlocks.length === 0) && post.body && post.body.length > 0) {
    post.contentBlocks = portableTextToContentBlocks(post.body);
  }

  return <PostEditor mode="edit" initialPost={post} />;
}
