// Shared in-memory task storage
export const tasks: any[] = [];
export let taskIdCounter = 1;

export function addTask(task: any) {
  const newTask = {
    id: taskIdCounter++,
    ...task,
    created_at: new Date().toISOString()
  };
  tasks.push(newTask);
  return newTask;
}

export function getTasks() {
  return tasks;
}
