import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';



export async function GET(request: Request) {
    try {
    // 建立 Resend 连接
    const resend = new Resend(process.env.RESEND_API_KEY);
  
    // 🔒 验证 Token
    // 🔒 验证 Token（跟 scrape 一样）
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📧 开始发送通知...');

    // 1️⃣ 查所有用户
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (usersError) {
      throw new Error(`查用户失败: ${usersError.message}`);
    }

    console.log(`👥 找到 ${users.length} 个用户`);

    let emailsSent = 0;
    let usersSkipped = 0;

    // 2️⃣ 对每个用户处理
    for (const user of users) {
      // 跳过没关键词的用户
      if (!user.keywords) {
        usersSkipped++;
        continue;
      }

      // 3️⃣ 处理关键词
      const keywords = user.keywords
        .split(',')
        .map((k: string) => k.trim().toLowerCase())
        .filter((k: string) => k.length > 0);

      if (keywords.length === 0) {
        usersSkipped++;
        continue;
      }

      // 4️⃣ 构建搜索条件
      const orConditions = keywords
        .map((k: string) => `title.ilike.%${k}%`)
        .join(',');

      // 5️⃣ 查匹配的岗位
      const { data: matchedJobs } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .or(orConditions)
        .order('created_at', { ascending: false })
        .limit(10);

      // 没匹配就跳过
      if (!matchedJobs || matchedJobs.length === 0) {
        console.log(`⚠️  ${user.email}: 没有匹配岗位`);
        usersSkipped++;
        continue;
      }

      // 6️⃣ 查已发过的岗位（防重复）
      const { data: sentNotifications } = await supabaseAdmin
        .from('notifications')
        .select('job_id')
        .eq('user_id', user.id);

      const sentJobIds = new Set(
        (sentNotifications || []).map((n) => n.job_id)
      );

      // 过滤掉已发过的
      const newJobs = matchedJobs.filter((job) => !sentJobIds.has(job.id));

      if (newJobs.length === 0) {
        console.log(`⚠️  ${user.email}: 没有新岗位（都发过了）`);
        usersSkipped++;
        continue;
      }

      // 7️⃣ 生成邮件 HTML
      const emailHtml = generateEmailHtml(newJobs, keywords);

      // 8️⃣ 发送邮件
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'JobPing <onboarding@resend.dev>',
        to: user.email,
        subject: `🎯 ${newJobs.length} 个新岗位匹配你的搜索`,
        html: emailHtml,
      });

      if (emailError) {
        console.error(`❌ 发给 ${user.email} 失败:`, emailError);
        continue;
      }

      console.log(`✅ 发给 ${user.email}: ${newJobs.length} 个岗位`);
      emailsSent++;

      // 9️⃣ 记录已发送（防重复）
      const notificationRecords = newJobs.map((job) => ({
        user_id: user.id,
        job_id: job.id,
      }));

      await supabaseAdmin.from('notifications').insert(notificationRecords);
    }

    console.log(`🎉 完成! 发送 ${emailsSent} 封, 跳过 ${usersSkipped} 个`);

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      emailsSent,
      usersSkipped,
    });
    } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
  );
}
}

// 🎨 生成邮件 HTML
function generateEmailHtml(jobs: any[], keywords: string[]): string {
  const jobCards = jobs
    .map(
      (job) => `
    <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #000;">
        ${job.title}
      </h3>
      <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">
        🏢 ${job.company} · 📍 ${job.location || 'Remote'}
      </p>
      <a href="${job.url}" 
         style="display: inline-block; margin-top: 8px; padding: 8px 16px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">
        查看岗位 →
      </a>
    </div>
  `
    )
    .join('');

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 24px; color: #000;">JobPing 🎯</h1>
      <p style="color: #666;">
        找到 <strong>${jobs.length}</strong> 个匹配你关键词（${keywords.join(', ')}）的新岗位：
      </p>
      <div style="margin-top: 24px;">
        ${jobCards}
      </div>
      <p style="margin-top: 32px; color: #999; font-size: 12px;">
        你收到这封邮件是因为订阅了 JobPing 岗位提醒。
      </p>
    </div>
  `;
}