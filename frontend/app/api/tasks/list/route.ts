import { NextRequest, NextResponse } from 'next/server';
import { getTasks } from '../store';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json({ success: false, detail: 'Not authenticated' }, { status: 401 });
  }
  
  const tasks = getTasks();
  
  return NextResponse.json({
    success: true,
    tasks: tasks.map(t => ({
      assignment_id: t.id,
      task: t,
      status: 'pending'
    }))
  });
}
