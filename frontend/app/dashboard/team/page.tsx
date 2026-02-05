'use client';

import { useState } from 'react';
import { 
  UserGroupIcon, 
  PlusIcon, 
  CheckCircleIcon,
  ClockIcon,
  BellIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

// Mock team data
const MOCK_TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Sarah Martinez',
    email: 'sarah@agency.com',
    phone: '(512) 555-0101',
    role: 'Team Leader',
    status: 'active',
    leadsAssigned: 23,
    leadsContacted: 18,
    responseTime: '4 min avg',
    availability: 'Available'
  },
  {
    id: 2,
    name: 'Mike Johnson',
    email: 'mike@agency.com',
    phone: '(512) 555-0102',
    role: 'Agent',
    status: 'active',
    leadsAssigned: 19,
    leadsContacted: 16,
    responseTime: '6 min avg',
    availability: 'Available'
  },
  {
    id: 3,
    name: 'Jessica Chen',
    email: 'jessica@agency.com',
    phone: '(512) 555-0103',
    role: 'Agent',
    status: 'busy',
    leadsAssigned: 21,
    leadsContacted: 19,
    responseTime: '3 min avg',
    availability: 'On Showing'
  },
  {
    id: 4,
    name: 'David Park',
    email: 'david@agency.com',
    phone: '(512) 555-0104',
    role: 'Agent',
    status: 'offline',
    leadsAssigned: 15,
    leadsContacted: 12,
    responseTime: '8 min avg',
    availability: 'Out of Office'
  }
];

const MOCK_ROUTING_HISTORY = [
  {
    id: 1,
    leadName: 'Robert Wilson',
    assignedTo: 'Mike Johnson',
    assignedAt: '2024-02-04 18:30:00',
    status: 'contacted',
    contactedAt: '2024-02-04 18:33:00',
    responseTime: '3 min'
  },
  {
    id: 2,
    leadName: 'Emily Davis',
    assignedTo: 'Jessica Chen',
    assignedAt: '2024-02-04 17:45:00',
    status: 'contacted',
    contactedAt: '2024-02-04 17:46:00',
    responseTime: '1 min'
  },
  {
    id: 3,
    leadName: 'James Brown',
    assignedTo: 'Sarah Martinez',
    assignedAt: '2024-02-04 17:20:00',
    status: 're-assigned',
    contactedAt: null,
    responseTime: 'Timeout (5 min)',
    reassignedTo: 'Mike Johnson'
  },
  {
    id: 4,
    leadName: 'Lisa Anderson',
    assignedTo: 'David Park',
    assignedAt: '2024-02-04 16:55:00',
    status: 'contacted',
    contactedAt: '2024-02-04 17:02:00',
    responseTime: '7 min'
  }
];

export default function TeamPage() {
  const [teamMembers] = useState(MOCK_TEAM_MEMBERS);
  const [routingHistory] = useState(MOCK_ROUTING_HISTORY);
  const [roundRobinEnabled, setRoundRobinEnabled] = useState(true);
  const [responseTimeout, setResponseTimeout] = useState(5);
  const [smsNotifications, setSmsNotifications] = useState(true);
  
  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    busy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    offline: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };
  
  const historyStatusColors = {
    contacted: 'bg-green-100 text-green-800',
    're-assigned': 'bg-yellow-100 text-yellow-800',
    timeout: 'bg-red-100 text-red-800'
  };
  
  return (
    <div className="p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <UserGroupIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Team Management
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your team and configure round-robin lead routing
        </p>
      </div>
      
      {/* Round Robin Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Round Robin Settings
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Round Robin</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically distribute new leads among available team members
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={roundRobinEnabled}
                onChange={(e) => setRoundRobinEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send SMS alerts to agents when new leads are assigned
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block font-medium text-gray-900 dark:text-white mb-2">
              Response Timeout (minutes)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="3"
                max="15"
                value={responseTimeout}
                onChange={(e) => setResponseTimeout(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 min-w-[60px] text-center">
                {responseTimeout} min
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              If an agent doesn't respond within this time, the lead will be re-assigned to the next available agent
            </p>
          </div>
        </div>
      </div>
      
      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Team Members ({teamMembers.length})
          </h2>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Add Member
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold mr-3">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[member.status]}`}>
                        {member.availability}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-900 dark:text-white">
                        <strong>{member.leadsAssigned}</strong> assigned
                      </p>
                      <p className="text-green-600 dark:text-green-400">
                        <strong>{member.leadsContacted}</strong> contacted
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {member.responseTime}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Routing History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <ArrowPathIcon className="w-6 h-6 mr-2" />
            Recent Routing Activity
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Response Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {routingHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.leadName}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {item.assignedTo}
                      {item.status === 're-assigned' && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          → Re-assigned to {item.reassignedTo}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {item.assignedAt}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${historyStatusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm font-medium ${
                      item.status === 're-assigned' 
                        ? 'text-red-600 dark:text-red-400'
                        : item.responseTime.includes('1 min') || item.responseTime.includes('3 min')
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {item.responseTime}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
