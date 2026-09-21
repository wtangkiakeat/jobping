import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  try {
    // 🔒 Check token
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 📧 Connect to Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 1️⃣ Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (usersError) {
      throw new Error(usersError.message);
    }

    let emailsSent = 0;
    let usersSkipped = 0;

    // 2️⃣ Handle each user
    for (const user of users) {
      if (!user.keywords) {
        usersSkipped++;
        continue;
      }

      // 3️⃣ Clean keywords
      const keywords = user.keywords
        .split(',')
        .map((k: string) => k.trim().toLowerCase())
        .filter((k: string) => k.length > 0);

      if (keywords.length === 0) {
        usersSkipped++;
        continue;
      }

      // 4️⃣ Build search
      const orConditions = keywords
        .map((k: string) => `title.ilike.%${k}%`)
        .join(',');

      // 5️⃣ Find matching jobs
      const { data: matchedJobs } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .or(orConditions)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!matchedJobs || matchedJobs.length === 0) {
        usersSkipped++;
        continue;
      }

      // 6️⃣ Find jobs already sent
      const { data: sentNotifications } = await supabaseAdmin
        .from('notifications')
        .select('job_id')
        .eq('user_id', user.id);

      const sentJobIds = new Set(
        (sentNotifications || []).map((n) => n.job_id)
      );

      // 7️⃣ Keep only new jobs
      const newJobs = matchedJobs.filter((job) => !sentJobIds.has(job.id));

      if (newJobs.length === 0) {
        usersSkipped++;
        continue;
      }

      // 8️⃣ Send email via Gmail
      try {
        await transporter.sendMail({
          from: `JobPing <${process.env.GMAIL_USER}>`,
          to: user.email,
          subject: `🎯 ${newJobs.length} new jobs match your search`,
          html: generateEmailHtml(newJobs, keywords),
        });
      } catch (emailError) {
        console.error(`Failed to send to ${user.email}:`, emailError);
        continue;
      }

      emailsSent++;

      // 9️⃣ Record as sent
      const records = newJobs.map((job) => ({
        user_id: user.id,
        job_id: job.id,
      }));
      await supabaseAdmin.from('notifications').insert(records);
    }

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      emailsSent,
      usersSkipped,
    });
  } catch (err) {
    // 🔒 Log privately, hide details from user
    console.error('Notification error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

// 🎨 Email template
function generateEmailHtml(jobs: any[], keywords: string[]): string {
  const jobCards = jobs
    .map(
      (job) => `
    <div style="border: 1px solid #e5e5e5; border-radius: 10px; padding: 16px; margin-bottom: 12px;">
      <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #111311;">${job.title}</h3>
      <p style="margin: 0 0 10px 0; color: #5B6152; font-size: 14px;">
        ${job.company} · ${job.location || 'Remote'}
      </p>
      <a href="${job.url}"
         style="display: inline-block; padding: 8px 16px; background: #1D5C3F; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px;">
        View job →
      </a>
    </div>
  `
    )
    .join('');

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111311;">
      <h1 style="font-size: 22px; margin: 0 0 8px 0;">JobPing 🎯</h1>
      <p style="color: #5B6152; margin: 0 0 24px 0;">
        ${jobs.length} new jobs match your keywords (${keywords.join(', ')}):
      </p>
      ${jobCards}
      <p style="margin-top: 32px; color: #999; font-size: 12px;">
        You're receiving this because you subscribed to JobPing job alerts.
      </p>
    </div>
  `;
}