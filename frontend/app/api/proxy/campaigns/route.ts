import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://agentassist-1.onrender.com';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/campaigns/`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ success: false, error: 'Proxy failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const body = await request.json();
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/campaigns/`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ success: false, error: 'Proxy failed' }, { status: 500 });
  }
}
