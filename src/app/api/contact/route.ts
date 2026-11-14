import { NextResponse } from 'next/server';
import { writeClient } from '@/sanity/client';
import { createBiginContact } from '@/lib/zohoBigin';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const project = typeof body.project === 'string' ? body.project.trim() : '';
  const date = typeof body.date === 'string' ? body.date.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const source = typeof body.source === 'string' ? body.source.trim() : 'contact';

  if (!name || !phone || !email) {
    return NextResponse.json(
      { error: 'Name, phone, and email are required' },
      { status: 400 }
    );
  }

  let leadId: string | undefined;

  try {
    const lead = await writeClient.create({
      _type: 'lead',
      name,
      phone,
      email,
      project: project || undefined,
      preferredDate: date || undefined,
      message: message || undefined,
      source,
      submittedAt: new Date().toISOString(),
    });
    leadId = lead._id;
  } catch (error) {
    console.error('Failed to save lead to Sanity:', error);
    return NextResponse.json(
      { error: 'Failed to save your request. Please try again or contact us directly.' },
      { status: 500 }
    );
  }

  // Best-effort push to Zoho Bigin CRM. The lead is already safely stored in
  // Sanity above, so a Bigin failure is logged but does not fail the request.
  try {
    await createBiginContact({ name, phone, email, project, date, message, source });
  } catch (error) {
    console.error('Failed to push lead to Zoho Bigin:', error);
  }

  return NextResponse.json({ success: true, id: leadId });
}
