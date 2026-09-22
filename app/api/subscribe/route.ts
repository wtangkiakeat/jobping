import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { correctKeywords } from '@/lib/spell';

export async function POST(request: Request) {
  try {
    // 🛡️ Rate limit: max 5 requests per IP per minute
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests, please try again later' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, keywords } = body;

    // ✅ Check email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email' },
        { status: 400 }
      );
    }

    // ✅ Check keywords
    if (!keywords || keywords.trim().length === 0 || keywords.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Please enter valid keywords (max 500 chars)' },
        { status: 400 }
      );
    }

    // 🔤 Fix typos (Levenshtein)
    const { corrected, changes } = correctKeywords(keywords);

    if (!corrected) {
      return NextResponse.json(
        { success: false, error: 'Please enter at least one keyword' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanKeywords = corrected;

    // Tell the user what we fixed
    const fixNote = changes.length
      ? ` We fixed: ${changes.map((c) => `${c.from} → ${c.to}`).join(', ')}.`
      : '';

    // Already subscribed? → update keywords
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (existingUser) {
      await supabaseAdmin
        .from('users')
        .update({ keywords: cleanKeywords })
        .eq('id', existingUser.id);

      return NextResponse.json({
        success: true,
        message: 'Your keywords have been updated!' + fixNote,
      });
    }

    // New user → save
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      email: cleanEmail,
      keywords: cleanKeywords,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Subscribed! You will receive matching job alerts.' + fixNote,
    });
  } catch (err) {
    // 🔒 Log privately, don't leak details
    console.error('Subscribe error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error, please try again' },
      { status: 500 }
    );
  }
}