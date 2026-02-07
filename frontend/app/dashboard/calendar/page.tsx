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
  start?: string;
  creator_name: string;
  creator_id?: number;
  is_creator: boolean;
  user_status?: string;
  assignments?: any[];
  assignment_id?: number;
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
    } else {
      // No user logged in - stop loading
      setLoading(false);
    }
  }, [userId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Fetching tasks, token present:', !!token);

      if (!token) {
        console.log('No token - skipping fetch');
        setTasks([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/teams/tasks/my-tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch tasks:', response.status, errorData);
        setTasks([]);
        return;
      }

      const data = await response.json();
      console.log('Tasks response:', data);

      if (data.success && Array.isArray(data.tasks)) {
        // Transform nested format to flat task objects
        const flatTasks: Task[] = data.tasks
          .filter((item: any) => item && item.task)
          .map((item: any) => ({
            id: item.task.id,
            title: item.task.title || 'Untitled',
            description: item.task.description,
            task_category: item.task.task_category || 'manual',
            task_type: item.task.task_type || 'optional',
            scheduled_for: item.task.scheduled_for,
            due_date: item.task.due_date,
            start: item.task.scheduled_for || item.task.due_date,
            creator_name: item.task.creator_name || 'Unknown',
            creator_id: item.task.creator_id,
            is_creator: false,
            user_status: item.status,
            assignment_id: item.assignment_id,
            assignments: []
          }));
        setTasks(flatTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');

      // Find the task to get assignment_id
      const task = tasks.find(t => t.id === taskId);
      if (!task?.assignment_id) {
        alert('Cannot update this task');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/teams/tasks/update-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            assignment_id: task.assignment_id,
            status: status
          })
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

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first');
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/teams/tasks/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: createData.title,
          description: createData.description || '',
          task_type: createData.task_type,
          task_category: createData.task_category,
          due_date: createData.scheduled_for || null,
          share_with_team: true,
          is_private: false
        })
      });

      const data = await response.json();
      console.log('Create task response:', response.status, data);
      
      if (response.ok && data.success) {
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
        alert(data.detail || data.message || `Error ${response.status}: Failed to create task`);
      }
    } catch (error) {
      console.error('Create task error:', error);
      alert('Network error - please try again');
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
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium text-[15px] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Task
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

      {/* Create Task Modal - Apple Style */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xl flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-blue-500 hover:text-blue-600 font-medium text-[17px] transition-colors"
                >
                  Cancel
                </button>
                <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                  New Task
                </h2>
                <button
                  onClick={handleCreateTask}
                  className="text-blue-500 hover:text-blue-600 font-semibold text-[17px] transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-4 space-y-6">
              {/* Title Input */}
              <div>
                <input
                  type="text"
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-[17px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="Task name"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <textarea
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-[17px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                  placeholder="Notes"
                  rows={3}
                />
              </div>

              {/* Type - Segmented Control */}
              <div>
                <label className="block text-[13px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                  Type
                </label>
                <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                  {[
                    { value: 'manual', label: 'Manual' },
                    { value: 'auto', label: 'AI Auto' },
                    { value: 'team', label: 'Team' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCreateData({ ...createData, task_category: option.value })}
                      className={`flex-1 py-2 px-3 rounded-lg text-[15px] font-medium transition-all ${
                        createData.task_category === option.value
                          ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority - Segmented Control */}
              <div>
                <label className="block text-[13px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                  Priority
                </label>
                <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
                  {[
                    { value: 'optional', label: 'Optional', color: 'text-green-500' },
                    { value: 'mandatory', label: 'Required', color: 'text-red-500' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCreateData({ ...createData, task_type: option.value })}
                      className={`flex-1 py-2 px-3 rounded-lg text-[15px] font-medium transition-all ${
                        createData.task_type === option.value
                          ? `bg-white dark:bg-zinc-700 ${option.color} shadow-sm`
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-[13px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={createData.scheduled_for}
                  onChange={(e) => setCreateData({ ...createData, scheduled_for: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-[17px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
