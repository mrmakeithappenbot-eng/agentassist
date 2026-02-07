import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'tasks-data.json');

interface Task {
  id: number;
  title: string;
  description: string;
  task_type: string;
  task_category: string;
  due_date: string | null;
  scheduled_for: string | null;
  start: string | null;
  share_with_team: boolean;
  is_private: boolean;
  creator_id: number;
  creator_name: string;
  created_at: string;
}

interface Store {
  tasks: Task[];
  nextId: number;
}

function loadStore(): Store {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
  return { tasks: [], nextId: 1 };
}

function saveStore(store: Store): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}

export function addTask(taskData: Partial<Task>): Task {
  const store = loadStore();
  
  const newTask: Task = {
    id: store.nextId++,
    title: taskData.title || '',
    description: taskData.description || '',
    task_type: taskData.task_type || 'optional',
    task_category: taskData.task_category || 'manual',
    due_date: taskData.due_date || null,
    scheduled_for: taskData.scheduled_for || taskData.due_date || null,
    start: taskData.start || taskData.due_date || null,
    share_with_team: taskData.share_with_team ?? true,
    is_private: taskData.is_private ?? false,
    creator_id: taskData.creator_id || 1,
    creator_name: taskData.creator_name || 'You',
    created_at: new Date().toISOString()
  };
  
  store.tasks.push(newTask);
  saveStore(store);
  
  return newTask;
}

export function getTasks(): Task[] {
  const store = loadStore();
  return store.tasks;
}

export function deleteTask(id: number): boolean {
  const store = loadStore();
  const index = store.tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    store.tasks.splice(index, 1);
    saveStore(store);
    return true;
  }
  return false;
}
