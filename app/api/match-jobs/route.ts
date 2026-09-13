import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1️⃣ 从 URL 参数拿关键词
    const { searchParams } = new URL(request.url);
    const keywordsParam = searchParams.get('keywords');

    // 2️⃣ 检查有没有传关键词
    if (!keywordsParam) {
      return NextResponse.json({
        success: false,
        error: '请传关键词。例如: /api/match-jobs?keywords=react,remote',
      });
    }

    // 3️⃣ 分割关键词
    // "react,remote" → ["react", "remote"]
    const keywords = keywordsParam
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) {
      return NextResponse.json({
        success: false,
        error: '关键词不能为空',
      });
    }

    // 4️⃣ 构建 or 条件
    // ["react", "remote"] → "title.ilike.%react%,title.ilike.%remote%"
    const orConditions = keywords
      .map((k) => `title.ilike.%${k}%`)
      .join(',');

    // 5️⃣ 查询数据库
    const { data: matchedJobs, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .or(orConditions)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      });
    }

    // 6️⃣ 返回结果
    return NextResponse.json({
      success: true,
      keywords: keywords,
      totalMatched: matchedJobs.length,
      jobs: matchedJobs,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
    });
  }
}