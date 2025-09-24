
import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';
import { storeSyncStatus } from '@/lib/database';

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
  try {
    console.log('SYNC: Starting manual data synchronization...');
    
    // Add 25 second timeout to prevent hanging
    const result = await withTimeout(syncAllData(), 25000);
    console.log(`SYNC: ${result.message}`);
    
    // Update Firebase with success status
    await storeSyncStatus('success', result.message);
    
    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MANUAL SYNC FAILED:', errorMessage);
    
    // Log failure status
    await storeSyncStatus('failure', 'Manual sync failed', errorMessage);
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
