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
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

interface UserProfile {
  email: string;
  full_name: string;
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
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-6 md:p-8">
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
                      defaultValue={user?.full_name || ''}
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
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <button className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors">
                    Save Changes
                  </button>
                </div>
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
