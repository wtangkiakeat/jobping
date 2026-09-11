import { chromium } from 'playwright';

async function scrapeWellfound() {
  console.log('🚀 启动爬虫...');

  // 打开浏览器（headless: false 让你看到过程）
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🌐 访问 Wellfound...');
  await page.goto('https://wellfound.com/jobs');

  // 等页面完全加载（重要！）
  console.log('⏳ 等待页面加载...');
  await page.waitForSelector('.styles_joblistingContainer__ZxslN', {
    timeout: 15000,
  });

  console.log('🔍 提取岗位数据...');

  // 用 page.evaluate() 在浏览器里跑 JS
  const jobs = await page.evaluate(() => {
    // 找到所有岗位卡片
    const cards = document.querySelectorAll('.styles_joblistingContainer__ZxslN');

    // 逐个提取信息
    const results: any[] = [];

    cards.forEach((card) => {
      // 找标题
      const titleEl = card.querySelector('.styles_joblistingTitle__zUwvF');
      const title = titleEl?.textContent?.trim() || '';

      // 找链接
      const linkEl = card.querySelector('.styles_joblistingTitleAnchor__DFCkK') as HTMLAnchorElement;
      const url = linkEl?.href || '';

      // 找公司
      const companyEl = card.querySelector('.styles_company__w5lec');
      const company = companyEl?.textContent?.trim() || '';

      // 找地点
      const locationEl = card.querySelector('.styles_location__il7AG');
      const location = locationEl?.textContent?.trim() || '';

      // 找发布时间
      const postedEl = card.querySelector('.styles_postedAt__0_MgO');
      const postedAt = postedEl?.textContent?.trim() || '';

      results.push({ title, company, location, url, postedAt });
    });

    return results;
  });

  console.log(`\n✅ 找到 ${jobs.length} 个岗位:\n`);

  // 漂亮打印
  jobs.forEach((job, i) => {
    console.log(`--- 岗位 ${i + 1} ---`);
    console.log(`📌 标题: ${job.title}`);
    console.log(`🏢 公司: ${job.company}`);
    console.log(`📍 地点: ${job.location}`);
    console.log(`⏰ 发布: ${job.postedAt}`);
    console.log(`🔗 链接: ${job.url}`);
    console.log('');
  });

  // 关闭浏览器
  await browser.close();
  console.log('👋 完成！');
}

scrapeWellfound();