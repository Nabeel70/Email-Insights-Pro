import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('MANUAL CLEAR: Attempting to clear Firebase status without SDK...');
    
    // For now, just test if we can hit this endpoint
    return NextResponse.json({ 
      success: true, 
      message: 'Manual clear endpoint working - ready to clear Firebase status',
      timestamp: new Date().toISOString(),
      note: 'This endpoint can be used to manually trigger status clearing'
    });
    
  } catch (error: any) {
    console.error('MANUAL CLEAR ERROR:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to clear status'
    }, { status: 500 });
  }
}
