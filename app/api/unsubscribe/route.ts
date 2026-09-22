import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

// A real user id looks like: 550e8400-e29b-41d4-a716-446655440000
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    // 🛡️ Rate limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests, please try again later' },
        { status: 429 }
      );
    }

    const { id } = await request.json();

    // ✅ Only accept real-looking ids
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid unsubscribe link' },
        { status: 400 }
      );
    }

    // Delete their sent history first, then the user
    await supabaseAdmin.from('notifications').delete().eq('user_id', id);

    const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "You've been unsubscribed. You won't receive any more emails.",
    });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}