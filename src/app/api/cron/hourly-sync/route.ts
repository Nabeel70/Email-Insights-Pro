
'use server';

import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';

// Timeout wrapper function
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export async function GET(request: Request) {
  // A manual trigger from the UI won't have the Google-Cloud-Scheduler user agent.
  // We check if the request is from a cron job, and if so, we validate the bearer token.
  // Otherwise, we allow the request to proceed, assuming it's a trusted manual trigger.
  const isCron = request.headers.get('User-Agent')?.includes('Google-Cloud-Scheduler');
  
  if (isCron) {
      const authToken = (request.headers.get('authorization') || '').split('Bearer ').at(1);
      if (!process.env.CRON_SECRET || authToken !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
      }
  }

  try {
    console.log('SYNC: Starting data synchronization...');
    
    // Add 25 second timeout to prevent hanging
    const result = await withTimeout(syncAllData(), 25000);
    console.log(`SYNC: ${result.message}`);
    
    // Note: Firebase logging temporarily removed due to Admin SDK issues in hosting environment
    // The syncAllData function handles its own Firebase updates using client SDK
    
    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('SYNC JOB FAILED:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
