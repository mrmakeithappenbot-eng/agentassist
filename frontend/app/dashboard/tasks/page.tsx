'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  CheckCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  TrashIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';
import { fetchWithAuth } from '@/lib/auth';

interface Task {
  id: number;
  title: string;
  description?: string;
  type: 'call' | 'email' | 'text' | 'meeting' | 'other';
  dueDate: string; // ISO date string
  dueTime?: string; // HH:MM format
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt?: string;
  leadName?: string;
  leadId?: number;
  createdAt: string;
}

const STORAGE_KEY = 'agentassist_tasks';

const taskTypes = [
  { value: 'call', label: 'Phone Call', icon: PhoneIcon, color: 'text-blue-500' },
  { value: 'email', label: 'Email', icon: EnvelopeIcon, color: 'text-purple-500' },
  { value: 'text', label: 'Text/SMS', icon: ChatBubbleLeftRightIcon, color: 'text-green-500' },
  { value: 'meeting', label: 'Meeting', icon: CalendarIcon, color: 'text-orange-500' },
  { value: 'other', label: 'Other', icon: ClipboardDocumentListIcon, color: 'text-gray-500' },
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');
  const [showCompleted, setShowCompleted] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'call' as Task['type'],
    dueDate: '',
    dueTime: '',
    priority: 'medium' as Task['priority'],
    leadName: '',
  });

  // Load tasks from API
  const fetchTasks = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
      const response = await fetchWithAuth(`${apiUrl}/api/tasks`);
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Set default date to today
  useEffect(() => {
    if (showModal && !form.dueDate) {
      const today = new Date().toISOString().split('T')[0];
      setForm(f => ({ ...f, dueDate: today }));
    }
  }, [showModal]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.dueDate) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
      const response = await fetchWithAuth(`${apiUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTasks(); // Refresh task list
        setForm({
          title: '',
          description: '',
          type: 'call',
          dueDate: '',
          dueTime: '',
          priority: 'medium',
          leadName: '',
        });
        setShowModal(false);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task');
    }
  };

  const handleToggleComplete = async (id: number) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
      const response = await fetchWithAuth(`${apiUrl}/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: !task.completed })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTasks(); // Refresh task list
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
      const response = await fetchWithAuth(`${apiUrl}/api/tasks/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTasks(); // Refresh task list
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Filter tasks
  const getFilteredTasks = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let filtered = tasks;
    
    // Apply date filter
    if (filter === 'today') {
      filtered = filtered.filter(t => t.dueDate === today);
    } else if (filter === 'week') {
      filtered = filtered.filter(t => t.dueDate >= today && t.dueDate <= weekFromNow);
    }
    
    // Apply completed filter
    if (!showCompleted) {
      filtered = filtered.filter(t => !t.completed);
    }
    
    // Sort by due date/time
    return filtered.sort((a, b) => {
      const dateCompare = a.dueDate.localeCompare(b.dueDate);
      if (dateCompare !== 0) return dateCompare;
      
      const timeA = a.dueTime || '23:59';
      const timeB = b.dueTime || '23:59';
      return timeA.localeCompare(timeB);
    });
  };

  const filteredTasks = getFilteredTasks();
  
  // Group tasks by type
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.type]) acc[task.type] = [];
    acc[task.type].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const todaysTasks = tasks.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return t.dueDate === today && !t.completed;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Tasks</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl 
              flex items-center gap-2 smooth-transition"
          >
            <PlusIcon className="w-5 h-5" />
            Add Task
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your calls, emails, texts, and meetings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass dark:glass-dark p-6 rounded-2xl border border-white/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Tasks</p>
            <CalendarIcon className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{todaysTasks.length}</p>
        </div>
        
        <div className="glass dark:glass-dark p-6 rounded-2xl border border-white/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {tasks.filter(t => t.completed).length}
          </p>
        </div>
        
        <div className="glass dark:glass-dark p-6 rounded-2xl border border-white/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
            <ClipboardDocumentListIcon className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</span>
        </div>
        
        <div className="flex gap-2">
          {(['today', 'week', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg smooth-transition
                ${filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'All'}
            </button>
          ))}
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show completed</span>
        </label>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="glass dark:glass-dark rounded-2xl p-12 text-center border border-white/30 dark:border-white/10">
          <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {filter === 'today' ? 'No tasks for today' : 'No tasks'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add your first task to get started with your daily schedule.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl 
              inline-flex items-center gap-2 smooth-transition"
          >
            <PlusIcon className="w-5 h-5" />
            Add Task
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {taskTypes.map(({ value, label, icon: Icon, color }) => {
            const tasksOfType = groupedTasks[value];
            if (!tasksOfType || tasksOfType.length === 0) return null;
            
            return (
              <div key={value}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {label}s ({tasksOfType.length})
                  </h2>
                </div>
                
                <div className="space-y-3">
                  {tasksOfType.map(task => (
                    <div
                      key={task.id}
                      className={`glass dark:glass-dark rounded-xl p-4 border border-white/30 dark:border-white/10
                        ${task.completed ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleComplete(task.id)}
                          className="mt-1 flex-shrink-0"
                        >
                          <CheckCircleIcon
                            className={`w-6 h-6 smooth-transition
                              ${task.completed
                                ? 'text-green-500 fill-green-500'
                                : 'text-gray-300 dark:text-gray-600 hover:text-green-500'
                              }`}
                          />
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h3 className={`font-semibold text-gray-900 dark:text-white
                              ${task.completed ? 'line-through' : ''}`}
                            >
                              {task.title}
                            </h3>
                            
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg smooth-transition"
                              >
                                <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {task.dueTime && (
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                {task.dueTime}
                              </span>
                            )}
                            {task.leadName && (
                              <span className="text-primary-600 dark:text-primary-400">
                                → {task.leadName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Task</h2>
              <button onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 smooth-transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Task Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Call John Smith about listing"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                    text-gray-900 dark:text-white placeholder-gray-400
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                    text-gray-900 dark:text-white placeholder-gray-400
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Task Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(f => ({ ...f, type: e.target.value as Task['type'] }))}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                    text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                >
                  {taskTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                      text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Time</label>
                  <input
                    type="time"
                    value={form.dueTime}
                    onChange={(e) => setForm(f => ({ ...f, dueTime: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                      text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                    text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lead/Contact Name</label>
                <input
                  type="text"
                  value={form.leadName}
                  onChange={(e) => setForm(f => ({ ...f, leadName: e.target.value }))}
                  placeholder="Optional"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                    text-gray-900 dark:text-white placeholder-gray-400
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium smooth-transition">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.title.trim() || !form.dueDate}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl 
                  text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed smooth-transition">
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
