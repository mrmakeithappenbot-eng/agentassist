'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  SparklesIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Task {
  id: number;
  title: string;
  description?: string;
  task_category: string;
  task_type: string;
  scheduled_for?: string;
  due_date?: string;
  creator_name: string;
  creator_id: number;
  is_creator: boolean;
  user_status?: string;
  assignments: any[];
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [createData, setCreateData] = useState({
    title: '',
    description: '',
    task_type: 'optional',
    task_category: 'manual',
    scheduled_for: '',
  });

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_URL}/api/tasks/calendar?user_id=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setTasks(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_URL}/api/tasks/${taskId}/status?user_id=${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTasks();
      } else {
        alert('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task status');
    }
  };

  const handleCreateTask = async () => {
    if (!createData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_URL}/api/tasks/?user_id=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(createData)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setCreateData({
          title: '',
          description: '',
          task_type: 'optional',
          task_category: 'manual',
          scheduled_for: '',
        });
        setShowCreateModal(false);
        await fetchTasks();
      } else {
        alert('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = task.start || task.scheduled_for || task.due_date;
      if (!taskDate) return false;
      
      const taskDay = new Date(taskDate);
      return taskDay.getDate() === date.getDate() &&
             taskDay.getMonth() === date.getMonth() &&
             taskDay.getFullYear() === date.getFullYear();
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg"></div>
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayTasks = getTasksForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-24 p-2 rounded-lg border smooth-transition cursor-pointer hover:shadow-lg ${
            isToday
              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 glass dark:glass-dark'
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-semibold ${
              isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {day}
            </span>
            {dayTasks.length > 0 && (
              <span className="text-xs bg-primary-500 text-white rounded-full px-2 py-0.5">
                {dayTasks.length}
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            {dayTasks.slice(0, 2).map(task => (
              <div
                key={task.id}
                className={`text-xs p-1 rounded truncate ${
                  task.task_category === 'auto'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}
              >
                {task.title}
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{dayTasks.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center mb-4">
            <CalendarIcon className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calendar
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            View all your tasks and what your AI is handling
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="glass dark:glass-dark px-6 py-3 rounded-xl font-semibold text-primary-600 dark:text-primary-400 hover:shadow-xl smooth-transition flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Task
        </button>
      </div>

      {/* Legend */}
      <div className="glass dark:glass-dark rounded-2xl p-6 mb-6 border border-white/30 dark:border-white/10">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center">
            <SparklesIcon className="w-5 h-5 text-purple-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Automated (AI)
            </span>
          </div>
          <div className="flex items-center">
            <UserIcon className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Manual (You)
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mandatory
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Optional
            </span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="glass dark:glass-dark rounded-2xl p-6 mb-8 border border-white/30 dark:border-white/10">
        {/* Month navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 smooth-transition"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 smooth-transition"
          >
            <ChevronRightIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      </div>

      {/* Selected date tasks or all upcoming tasks */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {selectedDate 
            ? `Tasks for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
            : 'All Upcoming Tasks'}
        </h2>

        {selectedDate && (
          <button
            onClick={() => setSelectedDate(null)}
            className="mb-4 text-primary-600 dark:text-primary-400 hover:underline text-sm"
          >
            ← Show all tasks
          </button>
        )}

        <div className="space-y-3">
          {(selectedDate ? selectedDateTasks : tasks).length === 0 ? (
            <div className="glass dark:glass-dark rounded-xl p-12 text-center border border-white/30 dark:border-white/10">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {selectedDate ? 'No tasks for this date' : 'No tasks yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                {selectedDate ? 'Pick another date or create a new task' : 'Create your first task to get started!'}
              </p>
            </div>
          ) : (
            (selectedDate ? selectedDateTasks : tasks).map((task) => (
              <div
                key={task.id}
                className="glass dark:glass-dark rounded-xl p-5 border border-white/30 dark:border-white/10 smooth-transition hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {task.task_category === 'auto' ? (
                        <SparklesIcon className="w-5 h-5 text-purple-500" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-blue-500" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </h3>
                      <div className={`w-3 h-3 rounded-full ${
                        task.task_type === 'mandatory' ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                      
                      {task.user_status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.user_status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          task.user_status === 'declined' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          task.user_status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {task.user_status.charAt(0).toUpperCase() + task.user_status.slice(1)}
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {task.start && new Date(task.start).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                      <div>Created by: {task.creator_name}</div>
                    </div>
                  </div>
                  
                  {!task.is_creator && (!task.user_status || task.user_status === 'pending') && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(task.id, 'accepted')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 smooth-transition text-sm font-medium"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(task.id, 'declined')}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 smooth-transition text-sm font-medium"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  
                  {!task.is_creator && task.user_status === 'accepted' && (
                    <button 
                      onClick={() => handleStatusUpdate(task.id, 'completed')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 smooth-transition text-sm font-medium"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass dark:glass-dark rounded-3xl p-8 max-w-lg w-full border border-white/30 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Create New Task
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                  placeholder="e.g., Team standup meeting"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select 
                  value={createData.task_category}
                  onChange={(e) => setCreateData({ ...createData, task_category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white"
                >
                  <option value="manual">Manual (You do it)</option>
                  <option value="auto">Automated (AI handles it)</option>
                  <option value="team">Team Task</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select 
                  value={createData.task_type}
                  onChange={(e) => setCreateData({ ...createData, task_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white"
                >
                  <option value="optional">Optional</option>
                  <option value="mandatory">Mandatory</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scheduled For
                </label>
                <input
                  type="datetime-local"
                  value={createData.scheduled_for}
                  onChange={(e) => setCreateData({ ...createData, scheduled_for: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 smooth-transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 smooth-transition"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
