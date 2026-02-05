'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [pendingCount] = useState(3);
  const [hunterLeads] = useState(12);
  const [activeLeads, setActiveLeads] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Fetch real lead stats from backend
  useEffect(() => {
    const fetchLeadStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/leads/stats`);
        const data = await response.json();
        
        if (data.success && data.stats) {
          setActiveLeads(data.stats.active_leads);
          setTotalLeads(data.stats.total_leads);
        }
      } catch (error) {
        console.error('Failed to fetch lead stats:', error);
        // Keep demo data on error
        setActiveLeads(47);
        setTotalLeads(47);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeadStats();
  }, []);
  
  return (
    <div className="p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what needs your attention.
        </p>
      </div>
      
      {/* Urgent: Pending Actions */}
      {pendingCount > 0 && (
        <div className="bg-warning-50 dark:bg-warning-900/20 border-l-4 border-warning-500 p-6 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-warning-600 dark:text-warning-400 mt-1" />
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-warning-900 dark:text-warning-100 mb-2">
                {pendingCount} Messages Awaiting Approval
              </h3>
              <p className="text-warning-700 dark:text-warning-300 mb-4">
                Your AI has drafted follow-up messages for new leads. Review and approve them now.
              </p>
              <Link 
                href="/dashboard/messages"
                className="inline-flex items-center px-6 py-3 bg-warning-600 text-white font-semibold rounded-lg hover:bg-warning-700 transition-colors"
              >
                Review Messages →
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/dashboard/leads">
          <StatCard 
            title="Active Leads"
            value={loading ? '...' : activeLeads.toString()}
            change={totalLeads > 0 ? `${totalLeads} total` : '+12%'}
            icon={ArrowTrendingUpIcon}
            positive
          />
        </Link>
        <StatCard 
          title="Messages Sent (24h)"
          value="18"
          change="+5"
          icon={CheckCircleIcon}
          positive
        />
        <StatCard 
          title="Hunter Prospects"
          value={hunterLeads.toString()}
          change="New today"
          icon={ClockIcon}
        />
        <StatCard 
          title="Response Rate"
          value="34%"
          change="+8%"
          icon={ArrowTrendingUpIcon}
          positive
        />
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard 
          title="The Hunter"
          description="View new FSBO & expired leads found today"
          href="/dashboard/hunter"
          badge={hunterLeads > 0 ? hunterLeads.toString() : undefined}
          color="blue"
        />
        <QuickActionCard 
          title="Create Listing Assets"
          description="Upload property photos for AI marketing generation"
          href="/dashboard/launchpad"
          color="purple"
        />
        <QuickActionCard 
          title="CRM Settings"
          description="Manage your CRM connection and sync settings"
          href="/settings/crm"
          color="gray"
        />
      </div>
      
      {/* Recent Activity */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          <ActivityItem 
            time="5 minutes ago"
            title="AI drafted message for John Smith"
            status="pending"
          />
          <ActivityItem 
            time="23 minutes ago"
            title="Email sent to Sarah Johnson"
            status="sent"
          />
          <ActivityItem 
            time="1 hour ago"
            title="12 new FSBO leads found in Austin, TX"
            status="success"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, positive }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className={`text-sm ${positive ? 'text-green-600' : 'text-gray-500'}`}>
        {change}
      </p>
    </div>
  );
}

function QuickActionCard({ title, description, href, badge, color }: any) {
  const colorClasses = {
    blue: 'border-primary-200 dark:border-primary-800 hover:border-primary-300',
    purple: 'border-purple-200 dark:border-purple-800 hover:border-purple-300',
    gray: 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
  };
  
  return (
    <Link 
      href={href}
      className={`block bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-2 ${colorClasses[color]} transition-colors`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {badge && (
          <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </Link>
  );
}

function ActivityItem({ time, title, status }: any) {
  const statusColors = {
    pending: 'bg-warning-100 text-warning-800',
    sent: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
  };
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {status}
      </span>
    </div>
  );
}
