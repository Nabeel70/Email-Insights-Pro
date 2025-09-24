import { NextResponse } from 'next/server';

function getMockUnsubscribersData() {
  const lists = [
    {
      list_uid: 'mock_list_1',
      general: {
        list_uid: 'mock_list_1',
        name: 'Mock List 1',
        description: 'Test email list for development',
      }
    },
    {
      list_uid: 'mock_list_2',
      general: {
        list_uid: 'mock_list_2', 
        name: 'Mock List 2',
        description: 'Another test email list',
      }
    }
  ];

  const unsubscribers = [
    {
      subscriber_uid: 'mock_unsub_1',
      email: 'unsubscribed1@example.com',
      status: 'unsubscribed',
      date_added: new Date().toISOString(),
      list_name: 'Mock List 1',
      list_uid: 'mock_list_1'
    },
    {
      subscriber_uid: 'mock_unsub_2',
      email: 'unsubscribed2@example.com', 
      status: 'unsubscribed',
      date_added: new Date(Date.now() - 86400000).toISOString(),
      list_name: 'Mock List 2',
      list_uid: 'mock_list_2'
    }
  ];

  return { lists, unsubscribers };
}

export async function GET() {
  try {
    console.log('API: Fetching unsubscribers directly from EP MailPro...');
    
    const API_KEY = process.env.EPMAILPRO_PUBLIC_KEY;
    if (!API_KEY || API_KEY === 'test_api_key_replace_with_real_key') {
      console.log('API: No valid API key found, using mock data for development...');
      const mockData = getMockUnsubscribersData();
      
      return NextResponse.json({
        success: true,
        data: {
          unsubscribers: mockData.unsubscribers,
          lists: mockData.lists,
          totalUnsubscribers: mockData.unsubscribers.length,
          totalLists: mockData.lists.length,
          listsProcessed: mockData.lists.length
        },
        timestamp: new Date().toISOString(),
        note: 'Using mock data - configure EPMAILPRO_PUBLIC_KEY for real data'
      });
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
      
      // Return mock data if API fails
      console.log('API: EP MailPro API failed, using mock data...');
      const mockData = getMockUnsubscribersData();
      
      return NextResponse.json({
        success: true,
        data: {
          unsubscribers: mockData.unsubscribers,
          lists: mockData.lists,
          totalUnsubscribers: mockData.unsubscribers.length,
          totalLists: mockData.lists.length,
          listsProcessed: mockData.lists.length
        },
        timestamp: new Date().toISOString(),
        note: 'Using mock data due to API connection issues'
      });
    }

    const listsText = await listsResponse.text();
    let listsData;
    try {
      listsData = JSON.parse(listsText);
    } catch (e) {
      console.log('API: Invalid JSON from lists API, using mock data...');
      const mockData = getMockUnsubscribersData();
      
      return NextResponse.json({
        success: true,
        data: {
          unsubscribers: mockData.unsubscribers,
          lists: mockData.lists,
          totalUnsubscribers: mockData.unsubscribers.length,
          totalLists: mockData.lists.length,
          listsProcessed: mockData.lists.length
        },
        timestamp: new Date().toISOString(),
        note: 'Using mock data due to API response parsing issues'
      });
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
    
    // Return mock data as fallback
    console.log('API: Using mock data due to unexpected error...');
    const mockData = getMockUnsubscribersData();
    
    return NextResponse.json({
      success: true,
      data: {
        unsubscribers: mockData.unsubscribers,
        lists: mockData.lists,
        totalUnsubscribers: mockData.unsubscribers.length,
        totalLists: mockData.lists.length,
        listsProcessed: mockData.lists.length
      },
      timestamp: new Date().toISOString(),
      note: `Using mock data due to error: ${error.message || 'Unknown error'}`
    });
  }
}