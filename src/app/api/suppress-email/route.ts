
import { NextResponse } from 'next/server';
import { addEmailToSuppressionList } from '@/lib/epmailpro';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await addEmailToSuppressionList(email);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.result.error || 'Failed to suppress email' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Suppress Email Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
