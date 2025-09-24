import { NextResponse } from 'next/server';

// Mock data for testing sync functionality
const mockCampaigns = [
  {
    campaign_uid: 'test-campaign-1',
    name: 'Test Campaign 1',
    subject: 'Test Subject 1',
    date_added: '2024-01-01 10:00:00',
    status: 'sent'
  },
  {
    campaign_uid: 'test-campaign-2', 
    name: 'Test Campaign 2',
    subject: 'Test Subject 2',
    date_added: '2024-01-02 10:00:00',
    status: 'sent'
  }
];

const mockStats = [
  {
    campaign_uid: 'test-campaign-1',
    opens: 100,
    unique_opens: 80,
    clicks: 25,
    unique_clicks: 20,
    bounces: 5,
    complaints: 1
  },
  {
    campaign_uid: 'test-campaign-2',
    opens: 150,
    unique_opens: 120,
    clicks: 35,
    unique_clicks: 30,
    bounces: 3,
    complaints: 0
  }
];

export async function GET() {
  try {
    console.log('MOCK SYNC: Starting mock data synchronization...');
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    
    const message = `Mock sync complete. Fetched ${mockCampaigns.length} campaigns, ${mockStats.length} stats, 0 lists, and 0 unsubscribers.`;
    console.log('MOCK SYNC:', message);
    
    return NextResponse.json({
      success: true,
      message,
      data: {
        campaigns: mockCampaigns,
        stats: mockStats,
        lists: [],
        unsubscribers: []
      }
    });
    
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MOCK SYNC FAILED:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}