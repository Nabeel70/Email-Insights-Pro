import { NextResponse } from 'next/server';
import { getListsForSync } from '@/lib/epmailpro';

export async function GET() {
  try {
    console.log('API: Fetching unsubscribers directly from EP MailPro...');
    
    // Get lists first, then get unsubscribers from each list
    const lists = await getListsForSync();
    
    // For now, return the lists data since we need to implement unsubscriber aggregation
    console.log(`API: Successfully fetched ${lists.length} lists (unsubscriber aggregation pending)`);
    
    return NextResponse.json({
      success: true,
      data: {
        lists,
        totalLists: lists.length,
        note: 'Unsubscriber aggregation from lists is pending implementation'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('API: Failed to fetch unsubscribers:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch unsubscribers',
      details: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}
