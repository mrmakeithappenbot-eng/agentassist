import { NextRequest, NextResponse } from 'next/server';
import { addTask } from '../store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ success: false, detail: 'Not authenticated' }, { status: 401 });
    }
    
    // Create task locally
    const newTask = addTask({
      title: body.title,
      description: body.description || '',
      task_type: body.task_type || 'optional',
      task_category: body.task_category || 'manual',
      due_date: body.due_date,
      scheduled_for: body.due_date,
      start: body.due_date,
      share_with_team: body.share_with_team ?? true,
      is_private: body.is_private ?? false,
      creator_id: 1,
      creator_name: 'You'
    });
    
    return NextResponse.json({ 
      success: true, 
      task: newTask 
    });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ 
      success: false, 
      detail: 'Error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
