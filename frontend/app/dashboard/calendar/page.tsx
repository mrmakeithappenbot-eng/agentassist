'use client';

import { useState } from 'react';
import { 
  CalendarIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

// Mock tasks
const MOCK_TASKS = [
  {
    id: 1,
    title: 'Follow up with new leads from Hunter',
    type: 'automated',
    priority: 'optional',
    scheduledFor: '2026-02-07T10:00:00',
    createdBy: 'System AI',
    status: 'pending'
  },
  {
    id: 2,
    title: 'Team meeting - Weekly strategy',
    type: 'manual',
    priority: 'mandatory',
    scheduledFor: '2026-02-07T14:00:00',
    createdBy: 'Team Leader',
    status: 'pending'
  },
  {
    id: 3,
    title: 'Review AI-drafted messages',
    type: 'manual',
    priority: 'mandatory',
    scheduledFor: '2026-02-07T09:00:00',
    createdBy: 'You',
    status: 'pending'
  },
  {
    id: 4,
    title: 'Send personalized email campaign',
    type: 'automated',
    priority: 'optional',
    scheduledFor: '2026-02-08T11:00:00',
    createdBy: 'System AI',
    status: 'pending'
  }
];

export default function CalendarPage() {
  const [tasks] = useState(MOCK_TASKS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Group tasks by date
  const groupedTasks = tasks.reduce((acc: any, task) => {
    const date = new Date(task.scheduledFor).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {});

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
              Automated (AI handles it)
            </span>
          </div>
          <div className="flex items-center">
            <UserIcon className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Manual (You do it)
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

      {/* Tasks grouped by date */}
      <div className="space-y-6">
        {Object.keys(groupedTasks).sort().map(date => (
          <div key={date}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            
            <div className="space-y-3">
              {groupedTasks[date].map((task: any) => (
                <div
                  key={task.id}
                  className="glass dark:glass-dark rounded-xl p-5 border border-white/30 dark:border-white/10 smooth-transition hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {task.type === 'automated' ? (
                          <SparklesIcon className="w-5 h-5 text-purple-500" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-blue-500" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        <div className={`w-3 h-3 rounded-full ${
                          task.priority === 'mandatory' ? 'bg-red-500' : 'bg-green-500'
                        }`}></div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {new Date(task.scheduledFor).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                        <div>Created by: {task.createdBy}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 smooth-transition text-sm font-medium">
                        Accept
                      </button>
                      <button className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 smooth-transition text-sm font-medium">
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal (placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass dark:glass-dark rounded-3xl p-8 max-w-lg w-full border border-white/30 dark:border-white/10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Create New Task
            </h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Team standup meeting"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50">
                  <option>Manual (You do it)</option>
                  <option>Automated (AI handles it)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50">
                  <option>Optional</option>
                  <option>Mandatory</option>
                </select>
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
                onClick={() => {
                  alert('Task creation coming soon!');
                  setShowCreateModal(false);
                }}
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
