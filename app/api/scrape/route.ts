import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    try {
      // 🔒 验证 Token
      const authHeader = request.headers.get('authorization');
      const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
  
      if (authHeader !== expectedToken) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
  
      console.log('🚀 开始爬取...');

    // 1️⃣ 下载 Hacker News 页面 HTML
    const response = await fetch('https://news.ycombinator.com/jobs', {
      headers: {
        // 装成真实浏览器
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`📄 下载 HTML: ${html.length} 字符`);

    // 2️⃣ 用 cheerio 解析
    const $ = cheerio.load(html);
    const jobs: any[] = [];

    // 3️⃣ 提取每个岗位
    $('tr.athing').each((_index, row) => {
      const titleEl = $(row).find('.titleline a').first();
      const title = titleEl.text().trim();
      const url = titleEl.attr('href') || '';

      if (!title || !url) return;

      // 提取公司名
      const companyMatch = title.match(/^([^(]+)/);
      const company = companyMatch ? companyMatch[1].trim() : title;

      jobs.push({
        title,
        company,
        location: 'Remote',
        url,
        source: 'hackernews',
      });
    });

    console.log(`✅ 找到 ${jobs.length} 个岗位`);

    // 4️⃣ 存进数据库（带去重）
    let savedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const job of jobs) {
      const { error } = await supabaseAdmin.from('jobs').insert(job);

      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          duplicateCount++;
        } else {
          errorCount++;
          console.error(`❌ ${job.title.slice(0, 40)}: ${error.message}`);
        }
      } else {
        savedCount++;
      }
    }

    console.log(
      `🎉 完成! 新增: ${savedCount}, 重复: ${duplicateCount}, 错误: ${errorCount}`
    );

    // 5️⃣ 返回结果
    return NextResponse.json({
      success: true,
      totalFound: jobs.length,
      newJobs: savedCount,
      duplicates: duplicateCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('爬虫失败:', err);
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
    });
  }
}