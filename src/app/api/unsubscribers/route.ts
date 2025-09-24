import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('API: Fetching unsubscribers directly from EP MailPro...');
    
    const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not found' }, { status: 500 });
    }

    // First get lists
    console.log('API: Fetching lists from EP MailPro...');
    const listsResponse = await fetch('https://app.bluespaghetti1.com/api/index.php/lists', {
      headers: {
        'X-MW-PUBLIC-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!listsResponse.ok) {
      const errorText = await listsResponse.text();
      console.log('API: Lists error response:', errorText.substring(0, 500));
      return NextResponse.json({ 
        error: `EP MailPro Lists API error: ${listsResponse.status}`,
        details: errorText.substring(0, 500)
      }, { status: 500 });
    }

    const listsText = await listsResponse.text();
    let listsData;
    try {
      listsData = JSON.parse(listsText);
    } catch (e) {
      return NextResponse.json({ 
        error: 'Invalid JSON from lists API',
        response: listsText.substring(0, 500)
      }, { status: 500 });
    }

    const lists = listsData?.data?.records || [];
    console.log(`API: Successfully fetched ${lists.length} lists`);

    // Get unsubscribers from each list
    const allUnsubscribers = [];
    const maxListsToProcess = 5; // Limit for performance

    for (const list of lists.slice(0, maxListsToProcess)) {
      const listUid = list.general?.list_uid;
      if (listUid) {
        try {
          console.log(`API: Fetching unsubscribers from list ${listUid}...`);
          const unsubResponse = await fetch(`https://app.bluespaghetti1.com/api/index.php/lists/${listUid}/subscribers?status=unsubscribed&per_page=100`, {
            headers: {
              'X-MW-PUBLIC-KEY': API_KEY,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          });

          if (unsubResponse.ok) {
            const unsubText = await unsubResponse.text();
            const unsubData = JSON.parse(unsubText);
            const unsubscribers = unsubData?.data?.records || [];
            
            // Add list info to each unsubscriber
            unsubscribers.forEach((unsub: any) => {
              unsub.list_name = list.general?.name || 'Unknown';
              unsub.list_uid = listUid;
              unsub.status = 'unsubscribed';
            });

            allUnsubscribers.push(...unsubscribers);
            console.log(`API: Found ${unsubscribers.length} unsubscribers in list ${listUid}`);
          }
        } catch (error) {
          console.log(`API: Failed to fetch unsubscribers from list ${listUid}:`, error);
        }
      }
    }

    console.log(`API: Total unsubscribers found: ${allUnsubscribers.length}`);
    
    return NextResponse.json({
      success: true,
      data: {
        unsubscribers: allUnsubscribers,
        lists,
        totalUnsubscribers: allUnsubscribers.length,
        totalLists: lists.length,
        listsProcessed: Math.min(lists.length, maxListsToProcess)
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