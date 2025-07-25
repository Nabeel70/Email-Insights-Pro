'use server';

import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/datasync';

export async function POST(request: Request) {
  try {
    const result = await syncAllData();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
