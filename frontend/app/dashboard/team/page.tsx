'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import {
  UserGroupIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

interface TeamMember {
  id: number;
  email: string;
  full_name: string;
  is_team_leader: boolean;
}

interface Task {
  assignment_id?: number;
  task: {
    id: number;
    title: string;
    description: string;
    task_type: string;
    due_date: string | null;
  };
  status?: string;
}

export default function TeamPage() {
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  
  // Modal states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  
  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState('optional');
  const [error, setError] = useState('');
  
  useEffect(() => {
    loadTeamData();
  }, []);
  
  const loadTeamData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Load team info
      const teamResponse = await fetchWithAuth(`${apiUrl}/api/teams/my-team`);
      const teamData = await teamResponse.json();
      
      if (teamData.success && teamData.team) {
        setTeam(teamData.team);
        setMembers(teamData.members || []);
        setIsLeader(teamData.is_leader);
        
        // Load tasks
        const tasksResponse = await fetchWithAuth(`${apiUrl}/api/teams/tasks/my-tasks`);
        const tasksData = await tasksResponse.json();
        if (tasksData.success) {
          setTasks(tasksData.tasks || []);
        }
        
        // Load performance metrics
        const perfResponse = await fetchWithAuth(`${apiUrl}/api/team-leads/team-performance`);
        const perfData = await perfResponse.json();
        if (perfData.success) {
          setPerformance(perfData.performance || []);
        }
        
        // Load activity feed
        const activityResponse = await fetchWithAuth(`${apiUrl}/api/team-leads/team-activity`);
        const activityData = await activityResponse.json();
        if (activityData.success) {
          setActivity(activityData.activity || []);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading team:', error);
      setLoading(false);
    }
  };
  
  const handleCreateTeam = async () => {
    console.log('Creating team...', { teamName, teamDescription });
    setError('');
    
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      console.log('API URL:', apiUrl);
      
      const response = await fetchWithAuth(`${apiUrl}/api/teams/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription
        })
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setShowCreateTeam(false);
        setTeamName('');
        setTeamDescription('');
        loadTeamData();
      } else {
        setError(data.detail || 'Failed to create team');
      }
    } catch (error: any) {
      console.error('Error creating team:', error);
      setError(error.message || 'Network error. Please try again.');
    }
  };
  
  const handleInviteMember = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetchWithAuth(`${apiUrl}/api/teams/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          team_id: team.id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowInviteMember(false);
        setInviteEmail('');
        loadTeamData();
      }
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };
  
  const handleCreateTask = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetchWithAuth(`${apiUrl}/api/teams/tasks/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          task_type: taskType,
          share_with_team: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateTask(false);
        setTaskTitle('');
        setTaskDescription('');
        loadTeamData();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };
  
  const handleUpdateTaskStatus = async (assignmentId: number, newStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetchWithAuth(`${apiUrl}/api/teams/tasks/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          status: newStatus
        })
      });
      
      loadTeamData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'accepted': return 'text-blue-600 bg-blue-50';
      case 'declined': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="w-5 h-5" />;
      case 'declined': return <XCircleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading team...</p>
        </div>
      </div>
    );
  }
  
  // No team - show create team option
  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create Your Team
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start collaborating with your team members
            </p>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Team
            </button>
          </div>
          
          {/* Create Team Modal */}
          {showCreateTeam && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4">Create Team</h3>
                
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Team Name</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="My Real Estate Team"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                    <textarea
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      placeholder="What's your team about?"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateTeam}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setShowCreateTeam(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Has team - show team dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {team.name}
          </h1>
          {team.description && (
            <p className="text-gray-600 dark:text-gray-400">{team.description}</p>
          )}
        </div>
        
        {/* Performance Dashboard */}
        {isLeader && performance.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Team Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Member</th>
                    <th className="text-center py-2">Leads</th>
                    <th className="text-center py-2">Completed</th>
                    <th className="text-center py-2">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((member) => (
                    <tr key={member.user_id} className="border-b">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          {member.is_leader && (
                            <span className="text-xs text-primary-600">Leader</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">{member.assigned_leads}</td>
                      <td className="text-center text-green-600">{member.completed_tasks}</td>
                      <td className="text-center text-yellow-600">{member.pending_tasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Activity Feed */}
        {activity.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activity.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary-600"></div>
                  <div className="flex-1">
                    <p className="text-sm">{item.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Team Members</h2>
                {isLeader && (
                  <button
                    onClick={() => setShowInviteMember(true)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                      {member.full_name?.[0] || member.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.full_name || member.email}</p>
                      {member.is_team_leader && (
                        <span className="text-xs text-primary-600">Team Leader</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">My Tasks</h2>
                {isLeader && (
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Task
                  </button>
                )}
              </div>
              
              {tasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No tasks assigned yet</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.assignment_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{task.task.title}</h3>
                          {task.task.description && (
                            <p className="text-gray-600 text-sm mt-1">{task.task.description}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusColor(task.status || 'pending')}`}>
                          {getStatusIcon(task.status || 'pending')}
                          {task.status || 'pending'}
                        </span>
                      </div>
                      
                      {task.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleUpdateTaskStatus(task.assignment_id!, 'accepted')}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.assignment_id!, 'declined')}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      
                      {task.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateTaskStatus(task.assignment_id!, 'completed')}
                          className="w-full mt-3 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Invite Member Modal */}
        {showInviteMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Invite Team Member</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="member@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">User must have an account to join</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleInviteMember}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Invite
                  </button>
                  <button
                    onClick={() => setShowInviteMember(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Create Task Modal */}
        {showCreateTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Create Task</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Task Title</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Follow up with lead"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Task details..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="optional">Optional</option>
                    <option value="mandatory">Mandatory</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTask}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateTask(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
