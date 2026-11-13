import React from 'react';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/adminAuth';
import PostEditor from '../../components/PostEditor';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect('/admin/login');
  }

  return <PostEditor mode="create" />;
}

