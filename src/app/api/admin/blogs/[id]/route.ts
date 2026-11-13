import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated } from '@/lib/adminAuth';
import { writeClient, client } from '@/sanity/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const post = await client.fetch(
      `*[_type == "post" && (_id == $id || slug.current == $id)][0]`,
      { id }
    );
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    // Look up doc by slug or _id
    const post = await client.fetch(
      `*[_type == "post" && (_id == $id || slug.current == $id)][0]{ _id, "slug": slug.current }`,
      { id }
    );

    if (post) {
      await writeClient.delete(post._id);
      revalidatePath('/blog');
      revalidatePath('/admin');
      if (post.slug) revalidatePath(`/blog/${post.slug}`);
    }

    return NextResponse.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

