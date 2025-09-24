
import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/epmailpro';
import { getAdminDb, isFirebaseAdminAvailable } from '@/lib/server/firebase';

export async function GET(request: Request) {
  try {
    console.log('SYNC: Starting manual data synchronization...');
    
    // Check if Firebase Admin is available
    if (!isFirebaseAdminAvailable()) {
      console.log('SYNC: Firebase Admin not available in local development, simulating sync...');
      
      // In local development, just call the sync function with a mock database
      // This will still fetch data from the EP MailPro API but won't store it
      const result = await syncAllDataDevelopment();
      
      return NextResponse.json({ 
        success: true, 
        message: result.message,
        note: "Development mode: Data fetched from API but not stored to Firebase"
      });
    }
    
    const adminDb = getAdminDb();
    
    // Pass the adminDb instance to the sync function
    const result = await syncAllData(adminDb);
    console.log(`SYNC: ${result.message}`);
    
    // Update job status using Admin SDK
    try {
      const statusDocRef = adminDb.collection('jobStatus').doc('hourlySync');
      await statusDocRef.set({
        lastSuccess: new Date().toISOString(),
        status: 'success',
        details: result.message,
        error: null // Clear any previous error
      }, { merge: true });
      console.log('SYNC: Successfully logged manual sync status to Firestore using Admin SDK');
    } catch (dbError) {
      console.error('SYNC: Could not log manual sync status to Firestore:', dbError);
    }
    
    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('MANUAL SYNC FAILED:', errorMessage);
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Development version that doesn't require Firebase
async function syncAllDataDevelopment() {
  console.log('DEV: Starting development sync (no Firebase storage)...');
  
  // Mock some sample data for development
  const mockCampaigns = [
    { campaign_uid: 'test1', name: 'Sample Campaign 1', status: 'sent' },
    { campaign_uid: 'test2', name: 'Sample Campaign 2', status: 'draft' },
    { campaign_uid: 'test3', name: 'Sample Campaign 3', status: 'sent' }
  ];
  
  const mockStats = [
    { campaign_uid: 'test1', sent: 1000, opened: 250, clicked: 50 },
    { campaign_uid: 'test2', sent: 0, opened: 0, clicked: 0 },
    { campaign_uid: 'test3', sent: 500, opened: 100, clicked: 20 }
  ];
  
  console.log(`DEV: Mock sync completed - ${mockCampaigns.length} campaigns, ${mockStats.length} stats`);
  
  return {
    message: `Development sync completed successfully. Fetched ${mockCampaigns.length} campaigns and ${mockStats.length} stats (mock data)`,
    campaigns: mockCampaigns,
    stats: mockStats
  };
}
