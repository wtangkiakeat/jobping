import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 🧪 测试 1: 往 users 表插入一条测试数据
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email: `test-${Date.now()}@example.com`,
        keywords: 'react, remote, entry-level',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({
        success: false,
        step: 'insert',
        error: insertError.message,
      });
    }

    // 🧪 测试 2: 从 users 表读所有数据
    const { data: allUsers, error: readError } = await supabaseAdmin
      .from('users')
      .select('*');

    if (readError) {
      return NextResponse.json({
        success: false,
        step: 'read',
        error: readError.message,
      });
    }

    // ✅ 全部成功！
    return NextResponse.json({
      success: true,
      message: '🎉 数据库连接成功！',
      newUser: newUser,
      totalUsers: allUsers.length,
      allUsers: allUsers,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
    });
  }
}