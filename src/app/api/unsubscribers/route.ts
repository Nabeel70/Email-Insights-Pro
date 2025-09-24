import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('API: Fetching unsubscribers...');
    
    const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not found' }, { status: 500 });
    }

    // Try to fetch from EP MailPro API first
    try {
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
        throw new Error(`EP MailPro Lists API error: ${listsResponse.status}`);
      }

      const listsText = await listsResponse.text();
      let listsData;
      try {
        listsData = JSON.parse(listsText);
      } catch (e) {
        throw new Error('Invalid JSON from lists API');
      }

      const lists = listsData?.data?.records || [];
      console.log(`API: Successfully fetched ${lists.length} lists from EP MailPro`);

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
        source: 'live',
        timestamp: new Date().toISOString()
      });

    } catch (fetchError) {
      console.log('API: EP MailPro API not accessible, using mock data for development...');
      console.error('Fetch error:', fetchError);
      
      // Return mock data for development
      const mockLists = [
        {
          general: {
            list_uid: 'mock-list-1',
            name: 'Newsletter Subscribers',
            description: 'Main newsletter list'
          }
        },
        {
          general: {
            list_uid: 'mock-list-2', 
            name: 'Product Updates',
            description: 'Product announcement list'
          }
        },
        {
          general: {
            list_uid: 'mock-list-3',
            name: 'VIP Customers',
            description: 'Premium customer list'
          }
        }
      ];

      const mockUnsubscribers = [
        {
          email: 'user1@example.com',
          unsubscribe_date: '2024-09-20 14:30:00',
          list_name: 'Newsletter Subscribers',
          list_uid: 'mock-list-1',
          status: 'unsubscribed'
        },
        {
          email: 'user2@example.com',
          unsubscribe_date: '2024-09-19 10:15:00',
          list_name: 'Product Updates',
          list_uid: 'mock-list-2',
          status: 'unsubscribed'
        },
        {
          email: 'user3@example.com',
          unsubscribe_date: '2024-09-18 16:45:00',
          list_name: 'Newsletter Subscribers',
          list_uid: 'mock-list-1',
          status: 'unsubscribed'
        }
      ];

      console.log(`API: Using mock data - ${mockLists.length} lists and ${mockUnsubscribers.length} unsubscribers`);
      
      return NextResponse.json({
        success: true,
        data: {
          unsubscribers: mockUnsubscribers,
          lists: mockLists,
          totalUnsubscribers: mockUnsubscribers.length,
          totalLists: mockLists.length,
          listsProcessed: mockLists.length
        },
        source: 'mock',
        timestamp: new Date().toISOString(),
        note: 'Development mode: Using mock data because EP MailPro API is not accessible'
      });
    }
    
  } catch (error: any) {
    console.error('API: Failed to fetch unsubscribers:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch unsubscribers',
      details: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}