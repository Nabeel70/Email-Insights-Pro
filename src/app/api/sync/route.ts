
'use server';

import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/datasync';

export async function GET(request: Request) {
  try {
    const result = await syncAllData();
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Sync Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during sync.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
