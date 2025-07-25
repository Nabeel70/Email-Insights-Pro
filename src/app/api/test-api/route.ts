
import { NextResponse } from 'next/server';
import { makeApiRequest } from '@/lib/epmailpro';

export async function POST(request: Request) {
  try {
    const { method, endpoint, params, body } = await request.json();

    if (!method || !endpoint) {
      return NextResponse.json({ error: 'Missing method or endpoint' }, { status: 400 });
    }
    
    const queryParams = (params || []).reduce((acc: Record<string, string>, p: {key: string, value: string}) => {
        if (p.key) acc[p.key] = p.value;
        return acc;
    }, {});

    const result = await makeApiRequest(method, endpoint, queryParams, body);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('API Test Route Error:', error);
    return NextResponse.json(
      { 
        error: error.message, 
        requestInfo: error.requestInfo 
      }, 
      { status: error.statusCode || 500 }
    );
  }
}
