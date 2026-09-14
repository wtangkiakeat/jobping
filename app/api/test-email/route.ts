import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'JobPing <onboarding@resend.dev>',
      to: 'wtangkiakeat@gmail.com',
      subject: '🎯 JobPing 测试邮件',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #000;">JobPing 🎯</h1>
          <p>恭喜！你的邮件系统工作正常！</p>
          <p>这是你的第一封测试邮件。</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ success: false, error });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
    });
  }
}