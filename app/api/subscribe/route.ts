import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1️⃣ 读取用户提交的数据
    const body = await request.json();
    const { email, keywords } = body;

    // 2️⃣ 验证 email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: '请输入有效的邮箱' },
        { status: 400 }
      );
    }

    // 3️⃣ 验证关键词
    if (!keywords || keywords.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '请输入至少一个关键词' },
        { status: 400 }
      );
    }

    // 4️⃣ 检查是否已注册
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      // 已存在 → 更新关键词
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ keywords: keywords.trim() })
        .eq('id', existingUser.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return NextResponse.json({
        success: true,
        message: '已更新你的订阅关键词！',
      });
    }

    // 5️⃣ 新用户 → 插入
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      email: email.toLowerCase().trim(),
      keywords: keywords.trim(),
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({
      success: true,
      message: '订阅成功！你会收到匹配的岗位通知。',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}