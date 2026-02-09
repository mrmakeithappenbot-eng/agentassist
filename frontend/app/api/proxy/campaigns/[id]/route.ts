import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://agentassist-1.onrender.com';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get('authorization');
  const body = await request.json();
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/campaigns/${params.id}`, {
      method: 'PUT',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get('authorization');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/campaigns/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader || '',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ success: false, error: 'Proxy failed' }, { status: 500 });
  }
}
