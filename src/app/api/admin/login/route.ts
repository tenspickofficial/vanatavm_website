import { NextResponse } from 'next/server';
import { checkCredentials, setAdminSession } from '@/lib/adminAuth';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (!checkCredentials(username, password)) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    await setAdminSession(username);
    return NextResponse.json({ success: true, message: 'Logged in successfully' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

