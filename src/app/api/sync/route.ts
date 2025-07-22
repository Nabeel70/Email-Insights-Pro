import { syncAndStoreDailyData } from '@/lib/sync';
import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET() {
  try {
    const result = await syncAndStoreDailyData();
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error) {
    console.error('API route error during sync:', error);
    return NextResponse.json(
      { error: 'Failed to complete data sync.' },
      { status: 500 }
    );
  }
}
