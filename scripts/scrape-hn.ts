import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载 .env.local
dotenv.config({ path: '.env.local' });

// 建立 Supabase 连接（用老板钥匙 - service role key）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function scrapeHackerNews() {
  console.log('🚀 启动爬虫...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🌐 访问 Hacker News Jobs...');
  await page.goto('https://news.ycombinator.com/jobs');

  console.log('⏳ 等待页面加载...');
  await page.waitForSelector('tr.athing', { timeout: 15000 });

  console.log('🔍 提取岗位数据...');

  const jobs = await page.evaluate(() => {
    const rows = document.querySelectorAll('tr.athing');
    const results: any[] = [];

    rows.forEach((row) => {
      const titleEl = row.querySelector('.titleline a') as HTMLAnchorElement;
      const title = titleEl?.textContent?.trim() || '';
      const url = titleEl?.href || '';

      // 从标题提取公司名
      const companyMatch = title.match(/^([^(]+)/);
      const company = companyMatch ? companyMatch[1].trim() : title;

      results.push({
        title,
        company,
        location: 'Remote',
        url,
        source: 'hackernews',
      });
    });

    return results;
  });

  console.log(`\n✅ 爬到 ${jobs.length} 个岗位\n`);

  await browser.close();
  console.log('👋 浏览器关闭\n');

  // 🆕 新增：存到 Supabase
  console.log('💾 保存到数据库...');

  let savedCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;

  for (const job of jobs) {
    // 检查 title 和 url 不能为空（数据库要求）
    if (!job.title || !job.url) {
      console.log(`⚠️  跳过：缺少 title 或 url`);
      skippedCount++;
      continue;
    }

    // 尝试插入
    const { error } = await supabase.from('jobs').insert({
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      source: job.source,
    });

    if (error) {
        // 判断是不是"重复"错误
        if (error.message.includes('duplicate') || error.code === '23505') {
          // 是重复 → 静默跳过（不打印失败）
          duplicateCount++;
        } else {
          // 真的失败
          console.log(`❌ 保存失败: ${job.title.slice(0, 40)}...`);
          console.log(`   原因: ${error.message}`);
          skippedCount++;
        }
      } else {
        savedCount++;
      }
    }

    console.log(`\n🎉 完成！`);
    console.log(`   ✅ 新增: ${savedCount} 条`);
    console.log(`   ♻️  重复跳过: ${duplicateCount} 条`);
    console.log(`   ⚠️  错误跳过: ${skippedCount} 条`);
}

scrapeHackerNews();