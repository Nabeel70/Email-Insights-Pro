// src/app/api/sync/route.ts
import { type NextRequest } from 'next/server';
import { syncAllData } from '@/lib/datasync';
import { admin } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication token from the request headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ message: 'Authentication token missing.' }), { status: 401 });
    }
    const idToken = authHeader.split(' ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Authenticated user for sync:', decodedToken.uid);
    } catch (error) {
      console.error('Error verifying authentication token for sync:', error);
      return new Response(JSON.stringify({ message: 'Authentication failed.' }), { status: 401 });
    }

    // Call the server action
    const result = await syncAllData();

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    console.error('API Sync Error:', error);
    return new Response(JSON.stringify({ message: error.message || 'An error occurred during sync.' }), { status: 500 });
  }
}