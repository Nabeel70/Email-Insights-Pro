
'use server';

import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';

export async function GET(request: Request) {
  try {
    console.log('SYNC: Starting manual data synchronization...');
    const result = await syncAllData();
    console.log(`SYNC: ${result.message}`);
    
    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MANUAL SYNC FAILED:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

    

    