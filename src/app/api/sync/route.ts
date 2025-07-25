
'use server';

import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/datasync';

export async function POST(request: Request) {
  try {
    const result = await syncAllData();
    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('API SYNC FAILED:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
