'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserCircleIcon, 
  BellIcon, 
  PaintBrushIcon, 
  ShieldCheckIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  CalculatorIcon,
  MapPinIcon,
  ReceiptPercentIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  PencilIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';
import { fetchWithAuth } from '@/lib/auth';

interface UserProfile {
  email: string;
  full_name: string;
  phone?: string;
  id: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeSection, setActiveSection] = useState('account');
  const [theme, setTheme] = useState('system');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    leadAlerts: true,
    taskReminders: true,
    weeklyDigest: false
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Account form state
  const [formData, setFormData] = useState({ full_name: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Team settings state
  const TEAM_STORAGE_KEY = 'agentassist_team_data';
  const [teamData, setTeamData] = useState<{
    teamName: string;
    joinCode: string;
    members: Array<{
      id: number;
      name: string;
      email: string;
      role: 'leader' | 'admin' | 'agent';
      calendarPermission: 'full' | 'request' | 'none';
    }>;
    hasTeam: boolean;
  } | null>(null);
  const [editingTeamName, setEditingTeamName] = useState(false);
  
  // Gmail connection state
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  
  // Expense tracking state
  const [expensePresets, setExpensePresets] = useState([
    { id: 1, name: 'Yard Sign', cost: 50, category: 'Marketing' },
    { id: 2, name: 'Lockbox', cost: 35, category: 'Equipment' },
    { id: 3, name: 'Photography Package', cost: 200, category: 'Marketing' },
    { id: 4, name: 'Staging Consultation', cost: 150, category: 'Services' },
  ]);
  const [mileageLog, setMileageLog] = useState<Array<{id: number; date: string; from: string; to: string; miles: number; purpose: string}>>([]);
  const [expenses, setExpenses] = useState<Array<{id: number; date: string; description: string; amount: number; category: string; receipt?: string}>>([
    { id: 1, date: '2026-01-01', description: 'AgentAssist CRM (Monthly)', amount: 50, category: 'Software' },
  ]);
  const [newPreset, setNewPreset] = useState({ name: '', cost: '', category: 'Marketing' });
  const [newMileage, setNewMileage] = useState({ date: '', from: '', to: '', miles: '', purpose: '' });
  const [newExpense, setNewExpense] = useState({ date: '', description: '', amount: '', category: 'Other' });
  const [expenseTab, setExpenseTab] = useState<'summary' | 'mileage' | 'expenses' | 'presets'>('summary');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          // Initialize form with user data
          setFormData({
            full_name: data.full_name || '',
            phone: data.phone || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
    
    // Check Gmail connection status
    const checkGmailStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
        const response = await fetchWithAuth(`${apiUrl}/api/gmail/status`);
        const data = await response.json();
        if (data.success && data.connected) {
          setGmailConnected(true);
          setGmailEmail(data.email);
        }
      } catch (error) {
        console.error('Failed to check Gmail status:', error);
      }
    };
    
    checkGmailStatus();
    
    // Check for Gmail OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('gmail') === 'connected') {
      const email = urlParams.get('email');
      alert(`Gmail connected successfully! ${email ? `Using: ${email}` : ''}`);
      // Clear URL params
      window.history.replaceState({}, '', '/dashboard/settings');
      checkGmailStatus(); // Refresh status
    } else if (urlParams.get('gmail') === 'error') {
      const msg = urlParams.get('msg');
      alert(`Gmail connection failed${msg ? `: ${msg}` : ''}`);
      window.history.replaceState({}, '', '/dashboard/settings');
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    
    // Load team data
    const savedTeam = localStorage.getItem(TEAM_STORAGE_KEY);
    if (savedTeam) {
      const parsed = JSON.parse(savedTeam);
      setTeamData(parsed);
      setNewTeamName(parsed.teamName || '');
    }
  }, [router]);
  
  // Save team data helper
  const saveTeamData = (data: typeof teamData) => {
    if (data) {
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(data));
      setTeamData(data);
    }
  };
  
  // Update team name
  const handleSaveTeamName = () => {
    if (!teamData || !newTeamName.trim()) return;
    saveTeamData({ ...teamData, teamName: newTeamName.trim() });
    setEditingTeamName(false);
  };
  
  // Update member role
  const handleUpdateMemberRole = (memberId: number, newRole: 'leader' | 'admin' | 'agent') => {
    if (!teamData) return;
    const updatedMembers = teamData.members.map(m => 
      m.id === memberId ? { ...m, role: newRole } : m
    );
    saveTeamData({ ...teamData, members: updatedMembers });
  };
  
  // Update calendar permission
  const handleUpdateCalendarPermission = (memberId: number, permission: 'full' | 'request' | 'none') => {
    if (!teamData) return;
    const updatedMembers = teamData.members.map(m => 
      m.id === memberId ? { ...m, calendarPermission: permission } : m
    );
    saveTeamData({ ...teamData, members: updatedMembers });
  };
  
  // Get current user's role
  const getCurrentUserRole = () => {
    if (!teamData) return null;
    const currentUser = teamData.members.find(m => m.name === 'You');
    return currentUser?.role || 'agent';
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone
        })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const error = await response.json();
        setSaveMessage({ type: 'error', text: error.detail || 'Failed to save profile' });
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleConnectGmail = async () => {
    setGmailLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
      const response = await fetchWithAuth(`${apiUrl}/api/gmail/oauth/url`);
      const data = await response.json();
      
      if (data.success && data.oauth_url) {
        // Redirect to Google OAuth
        window.location.href = data.oauth_url;
      } else {
        alert('Failed to connect Gmail: ' + (data.detail || 'Unknown error'));
        setGmailLoading(false);
      }
    } catch (error) {
      console.error('Gmail connection error:', error);
      alert('Error connecting Gmail');
      setGmailLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm('Disconnect Gmail? You will no longer be able to send campaigns.')) return;
    
    setGmailLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
      const response = await fetchWithAuth(`${apiUrl}/api/gmail/disconnect`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setGmailConnected(false);
        setGmailEmail(null);
      }
    } catch (error) {
      console.error('Gmail disconnect error:', error);
      alert('Error disconnecting Gmail');
    } finally {
      setGmailLoading(false);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const menuItems = [
    { id: 'account', label: 'Account', icon: UserCircleIcon },
    { id: 'team', label: 'Team', icon: UserGroupIcon },
    { id: 'import', label: 'Import Leads', icon: ArrowUpTrayIcon },
    { id: 'expenses', label: 'Expenses', icon: CalculatorIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'billing', label: 'Billing', icon: CreditCardIcon },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Menu */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors
                    ${activeSection === item.id 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                    ${item.id !== menuItems[menuItems.length - 1].id ? 'border-b border-gray-100 dark:border-gray-700' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                </button>
              ))}
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* Account Section */}
            {activeSection === 'account' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Account
                </h2>
                
                {/* Profile Photo */}
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {user?.full_name || 'No name set'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-600 border-0 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1.5 text-xs text-gray-400">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  {saveMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${
                      saveMessage.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}>
                      {saveMessage.text}
                    </div>
                  )}
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Team Section */}
            {activeSection === 'team' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Team Settings
                </h2>
                
                {!teamData?.hasTeam ? (
                  <div className="text-center py-12">
                    <UserGroupIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Team Yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Join or create a team to manage team settings.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard/team')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      Go to Team Page
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Team Name */}
                    <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Team Name
                      </label>
                      {editingTeamName ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveTeamName}
                            className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingTeamName(false);
                              setNewTeamName(teamData.teamName);
                            }}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-medium text-gray-900 dark:text-white">
                            {teamData.teamName}
                          </span>
                          {(getCurrentUserRole() === 'leader' || getCurrentUserRole() === 'admin') && (
                            <button
                              onClick={() => setEditingTeamName(true)}
                              className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                            >
                              <PencilIcon className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Your Role */}
                    <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Your Role
                      </label>
                      <div className="flex items-center gap-2">
                        {getCurrentUserRole() === 'leader' && (
                          <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-sm font-medium">
                            👑 Team Leader
                          </span>
                        )}
                        {getCurrentUserRole() === 'admin' && (
                          <span className="px-3 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-sm font-medium">
                            ⭐ Admin
                          </span>
                        )}
                        {getCurrentUserRole() === 'agent' && (
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                            Agent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {getCurrentUserRole() === 'leader' && 'You have full control over team settings and can assign roles.'}
                        {getCurrentUserRole() === 'admin' && 'You can manage members and add events to calendars.'}
                        {getCurrentUserRole() === 'agent' && 'You can request to add events to other members\' calendars.'}
                      </p>
                    </div>

                    {/* Team Members & Permissions (Leaders/Admins only) */}
                    {(getCurrentUserRole() === 'leader' || getCurrentUserRole() === 'admin') && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Member Roles & Permissions
                        </h3>
                        <div className="space-y-3">
                          {teamData.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {member.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                                  <p className="text-sm text-gray-500">{member.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {/* Role Selector */}
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as 'leader' | 'admin' | 'agent')}
                                  disabled={member.role === 'leader' && getCurrentUserRole() !== 'leader'}
                                  className="px-3 py-1.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm disabled:opacity-50"
                                >
                                  <option value="leader">👑 Leader</option>
                                  <option value="admin">⭐ Admin</option>
                                  <option value="agent">Agent</option>
                                </select>
                                
                                {/* Calendar Permission */}
                                <select
                                  value={member.calendarPermission || 'request'}
                                  onChange={(e) => handleUpdateCalendarPermission(member.id, e.target.value as 'full' | 'request' | 'none')}
                                  className="px-3 py-1.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm"
                                >
                                  <option value="full">📅 Full Access</option>
                                  <option value="request">🔔 Request Only</option>
                                  <option value="none">🚫 No Access</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Calendar Permissions
                          </h4>
                          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• <strong>Full Access:</strong> Can add events directly to this member's calendar</li>
                            <li>• <strong>Request Only:</strong> Must request approval before adding events</li>
                            <li>• <strong>No Access:</strong> Cannot add events to this member's calendar</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Join Code */}
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Team Join Code
                      </label>
                      <div className="flex items-center gap-3">
                        <code className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-lg font-mono">
                          {teamData.joinCode}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(teamData.joinCode);
                            alert('Code copied!');
                          }}
                          className="px-3 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg text-sm"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Share this code with agents to invite them to your team.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import Leads Section */}
            {activeSection === 'import' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Import Leads
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Import leads from your CRM or a CSV file. Supported formats: CSV, Excel.
                </p>

                {/* CSV Upload */}
                <CsvImporter />

                {/* Gmail Integration */}
                <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <EnvelopeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Gmail Integration
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {gmailConnected 
                            ? `Connected: ${gmailEmail}`
                            : 'Send campaigns from your Gmail account (10,000 emails/day free!)'}
                        </p>
                      </div>
                    </div>
                    {gmailConnected ? (
                      <button
                        onClick={handleDisconnectGmail}
                        disabled={gmailLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {gmailLoading ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectGmail}
                        disabled={gmailLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {gmailLoading ? 'Connecting...' : 'Connect Gmail'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="/dashboard/leads"
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">View All Leads</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Manage your existing leads</p>
                    </div>
                  </a>
                  <a
                    href="/dashboard/hunter"
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <MagnifyingGlassIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">The Hunter</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Find FSBO & expired listings</p>
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* Expenses Section */}
            {activeSection === 'expenses' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Expense Tracking
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Track expenses, mileage, and receipts for tax deductions
                </p>

                {/* Expense Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                  {[
                    { id: 'summary', label: 'Summary' },
                    { id: 'mileage', label: 'Mileage' },
                    { id: 'expenses', label: 'Expenses' },
                    { id: 'presets', label: 'Presets' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setExpenseTab(tab.id as any)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        expenseTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Summary Tab */}
                {expenseTab === 'summary' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Mileage</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {mileageLog.reduce((sum, m) => sum + m.miles, 0).toLocaleString()} mi
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          ≈ ${(mileageLog.reduce((sum, m) => sum + m.miles, 0) * 0.67).toFixed(2)} deduction
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                        <p className="text-sm text-green-600 dark:text-green-400 mb-1">Total Expenses</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-green-500 mt-1">{expenses.length} transactions</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                        <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">YTD Deductions</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          ${(expenses.reduce((sum, e) => sum + e.amount, 0) + mileageLog.reduce((sum, m) => sum + m.miles, 0) * 0.67).toFixed(2)}
                        </p>
                        <p className="text-xs text-purple-500 mt-1">2026 Tax Year</p>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Recent Activity</h3>
                      <div className="space-y-2">
                        {expenses.slice(0, 5).map((exp) => (
                          <div key={exp.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{exp.description}</p>
                              <p className="text-xs text-gray-500">{exp.date} • {exp.category}</p>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">${exp.amount}</p>
                          </div>
                        ))}
                        {expenses.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No expenses recorded yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mileage Tab */}
                {expenseTab === 'mileage' && (
                  <div className="space-y-6">
                    {/* Add Mileage Form */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Log Trip</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={newMileage.date}
                          onChange={(e) => setNewMileage({...newMileage, date: e.target.value})}
                          className="px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Purpose (e.g., Showing at 123 Main St)"
                          value={newMileage.purpose}
                          onChange={(e) => setNewMileage({...newMileage, purpose: e.target.value})}
                          className="px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="From address"
                          value={newMileage.from}
                          onChange={(e) => setNewMileage({...newMileage, from: e.target.value})}
                          className="px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="To address"
                          value={newMileage.to}
                          onChange={(e) => setNewMileage({...newMileage, to: e.target.value})}
                          className="px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Miles"
                          value={newMileage.miles}
                          onChange={(e) => setNewMileage({...newMileage, miles: e.target.value})}
                          className="px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => {
                            if (newMileage.date && newMileage.miles) {
                              setMileageLog([...mileageLog, {
                                id: Date.now(),
                                ...newMileage,
                                miles: parseFloat(newMileage.miles)
                              }]);
                              setNewMileage({ date: '', from: '', to: '', miles: '', purpose: '' });
                            }
                          }}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                        >
                          Add Trip
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 2026 IRS mileage rate: $0.67/mile
                      </p>
                    </div>

                    {/* Mileage Log */}
                    <div className="space-y-2">
                      {mileageLog.map((trip) => (
                        <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <MapPinIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{trip.purpose || 'Business Trip'}</p>
                              <p className="text-xs text-gray-500">{trip.from} → {trip.to}</p>
                              <p className="text-xs text-gray-400">{trip.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">{trip.miles} mi</p>
                            <p className="text-xs text-green-600">${(trip.miles * 0.67).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                      {mileageLog.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No trips logged yet. Add your first trip above!</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Expenses Tab */}
                {expenseTab === 'expenses' && (
                  <div className="space-y-6">
                    {/* Quick Add from Presets */}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quick Add</h3>
                      <div className="flex flex-wrap gap-2">
                        {expensePresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              setExpenses([...expenses, {
                                id: Date.now(),
                                date: today,
                                description: preset.name,
                                amount: preset.cost,
                                category: preset.category
                              }]);
                            }}
                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {preset.name} <span className="text-gray-500">${preset.cost}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual Add */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Add Expense</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                          className="px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        />
                        <select
                          value={newExpense.category}
                          onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                          className="px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        >
                          <option value="Marketing">Marketing</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Software">Software</option>
                          <option value="Services">Services</option>
                          <option value="Meals">Meals & Entertainment</option>
                          <option value="Office">Office Supplies</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Description"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                          className="px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Amount"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                          />
                          <button
                            onClick={() => {
                              if (newExpense.description && newExpense.amount) {
                                setExpenses([...expenses, {
                                  id: Date.now(),
                                  date: newExpense.date || new Date().toISOString().split('T')[0],
                                  description: newExpense.description,
                                  amount: parseFloat(newExpense.amount),
                                  category: newExpense.category
                                }]);
                                setNewExpense({ date: '', description: '', amount: '', category: 'Other' });
                              }
                            }}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                          <input type="file" accept="image/*,.pdf" className="hidden" />
                          <ReceiptPercentIcon className="w-5 h-5" />
                          Attach receipt (optional)
                        </label>
                      </div>
                    </div>

                    {/* Expense List */}
                    <div className="space-y-2">
                      {expenses.map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{exp.description}</p>
                            <p className="text-xs text-gray-500">{exp.date} • {exp.category}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-gray-900 dark:text-white">${exp.amount}</p>
                            <button
                              onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Presets Tab */}
                {expenseTab === 'presets' && (
                  <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-400">
                      Create presets for common expenses to quickly log them with one click.
                    </p>

                    {/* Add Preset Form */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Add Preset</h3>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Name (e.g., Yard Sign)"
                          value={newPreset.name}
                          onChange={(e) => setNewPreset({...newPreset, name: e.target.value})}
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Cost"
                          value={newPreset.cost}
                          onChange={(e) => setNewPreset({...newPreset, cost: e.target.value})}
                          className="w-24 px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        />
                        <select
                          value={newPreset.category}
                          onChange={(e) => setNewPreset({...newPreset, category: e.target.value})}
                          className="px-3 py-2 bg-white dark:bg-gray-600 rounded-lg text-sm"
                        >
                          <option value="Marketing">Marketing</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Services">Services</option>
                          <option value="Other">Other</option>
                        </select>
                        <button
                          onClick={() => {
                            if (newPreset.name && newPreset.cost) {
                              setExpensePresets([...expensePresets, {
                                id: Date.now(),
                                name: newPreset.name,
                                cost: parseFloat(newPreset.cost),
                                category: newPreset.category
                              }]);
                              setNewPreset({ name: '', cost: '', category: 'Marketing' });
                            }
                          }}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Preset List */}
                    <div className="space-y-2">
                      {expensePresets.map((preset) => (
                        <div key={preset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{preset.name}</p>
                            <p className="text-xs text-gray-500">{preset.category}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-gray-900 dark:text-white">${preset.cost}</p>
                            <button
                              onClick={() => setExpensePresets(expensePresets.filter(p => p.id !== preset.id))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Notifications
                </h2>
                
                <div className="space-y-1">
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                    { key: 'push', label: 'Push Notifications', desc: 'Browser notifications for important events' },
                    { key: 'leadAlerts', label: 'New Lead Alerts', desc: 'Get notified when new leads come in' },
                    { key: 'taskReminders', label: 'Task Reminders', desc: 'Reminders for upcoming and overdue tasks' },
                    { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of your week every Sunday' },
                  ].map((item, index, arr) => (
                    <div 
                      key={item.key}
                      className={`flex items-center justify-between py-4 ${index !== arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                        className={`relative w-12 h-7 rounded-full transition-colors ${
                          notifications[item.key as keyof typeof notifications] 
                            ? 'bg-primary-600' 
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span 
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                            notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : ''
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Appearance
                </h2>
                
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light', icon: SunIcon },
                      { id: 'dark', label: 'Dark', icon: MoonIcon },
                      { id: 'system', label: 'System', icon: ComputerDesktopIcon },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleThemeChange(option.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          theme === option.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <option.icon className={`w-6 h-6 ${theme === option.id ? 'text-primary-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${theme === option.id ? 'text-primary-600' : 'text-gray-600 dark:text-gray-300'}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Security
                </h2>
                
                <div className="space-y-6">
                  <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Password</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Change your password to keep your account secure
                    </p>
                    <button className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                      Change Password
                    </button>
                  </div>
                  
                  <div className="pb-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <button className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Active Sessions</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Manage devices where you're currently logged in
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <ComputerDesktopIcon className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Current Session</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Active now</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 rounded-full">
                          This device
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Section */}
            {activeSection === 'billing' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Billing
                </h2>
                
                {/* Current Plan */}
                <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white mb-6">
                  <p className="text-primary-100 text-sm mb-1">Current Plan</p>
                  <h3 className="text-2xl font-bold mb-4">Free Trial</h3>
                  <p className="text-primary-100">
                    Upgrade to unlock AI automation and advanced features
                  </p>
                </div>
                
                {/* Upgrade Card */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pro Plan</h3>
                      <p className="text-gray-500 dark:text-gray-400">Everything you need to grow</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 line-through">$150/mo</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">$50<span className="text-sm font-normal text-gray-500">/first month</span></p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {[
                      'Unlimited AI follow-ups',
                      'Smart lead prioritization',
                      'Team collaboration tools',
                      'Calendar & task management',
                      'Priority support'
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// CSV Importer Component
function CsvImporter() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setResult({ success: false, message: 'Please upload a CSV file' });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
      const response = await fetchWithAuth(`${apiUrl}/api/leads/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({ 
          success: true, 
          message: data.message || `Successfully imported ${data.imported} leads!`,
          count: data.imported 
        });
      } else {
        setResult({ success: false, message: data.error || 'Failed to import leads' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="mb-6">
      <div 
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors
          ${dragOver 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <>
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Importing leads...
            </p>
          </>
        ) : (
          <>
            <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your CSV file here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              or click to browse
            </p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="csv-upload"
              onChange={handleFileChange}
            />
            <label
              htmlFor="csv-upload"
              className="inline-block px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors cursor-pointer"
            >
              Choose File
            </label>
          </>
        )}
      </div>

      {/* Result Message */}
      {result && (
        <div className={`mt-4 p-4 rounded-xl ${
          result.success 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          <p className="font-medium">{result.message}</p>
          {result.success && result.count && (
            <p className="text-sm mt-1 opacity-80">
              Your leads are now available in the Leads and Pipeline pages.
            </p>
          )}
        </div>
      )}

      {/* Column Mapping Info */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supported columns:</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          first_name, last_name, email, phone, status, location, price_min, price_max, tags
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Column names are flexible (e.g., "First Name", "firstName", "first-name" all work)
        </p>
      </div>
    </div>
  );
}
