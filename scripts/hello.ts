import { chromium } from 'playwright';

async function main() {
  console.log('🚀 打开浏览器...');

  // 打开 Chromium (headless: false = 你能看到浏览器窗口)
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🌐 访问 Google...');
  await page.goto('https://www.google.com');

  console.log('⏰ 等待 3 秒让你看...');
  await page.waitForTimeout(3000);

  console.log('📸 截图保存到 hello.png');
  await page.screenshot({ path: 'hello.png' });

  console.log('👋 关闭浏览器');
  await browser.close();

  console.log('✅ 完成！查看 hello.png');
}

main();