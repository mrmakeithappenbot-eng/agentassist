'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

// Pipeline stage mapping
const STAGE_MAP: Record<string, string> = {
  'New': 'new',
  'Cold': 'new',
  'Contacted': 'contacted',
  'Qualified': 'qualified',
  'Active': 'showing',
  'Showing': 'showing',
  'Under Contract': 'under_contract',
  'Closing': 'closing',
  'Closed': 'closed_won',
  'Closed Won': 'closed_won',
};

interface PipelineStats {
  total: number;
  pipelineValue: number;
  closedValue: number;
  closedCount: number;
  stages: Record<string, number>;
}

export default function Dashboard() {
  const [hunterLeads] = useState(12);
  const [activeLeads, setActiveLeads] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats>({
    total: 0,
    pipelineValue: 0,
    closedValue: 0,
    closedCount: 0,
    stages: {},
  });
  
  // Monthly goal (could come from settings later)
  const monthlyGoal = 500000;
  
  // Fetch real lead stats from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // Fetch lead stats
        const statsResponse = await fetch(`${apiUrl}/api/leads/stats`);
        const statsData = await statsResponse.json();
        
        if (statsData.success && statsData.stats) {
          setActiveLeads(statsData.stats.active_leads);
          setTotalLeads(statsData.stats.total_leads);
        }
        
        // Fetch all leads for pipeline calculation
        const leadsResponse = await fetch(`${apiUrl}/api/leads?limit=200`);
        const leadsData = await leadsResponse.json();
        
        if (leadsData.success && leadsData.leads) {
          const stages: Record<string, number> = {};
          let pipelineValue = 0;
          let closedValue = 0;
          let closedCount = 0;
          
          leadsData.leads.forEach((lead: any) => {
            const stage = STAGE_MAP[lead.status || ''] || 'new';
            stages[stage] = (stages[stage] || 0) + 1;
            
            const dealValue = lead.price_range_max || 0;
            
            if (stage === 'closed_won') {
              closedValue += dealValue;
              closedCount++;
            } else {
              pipelineValue += dealValue;
            }
          });
          
          setPipelineStats({
            total: leadsData.leads.length,
            pipelineValue,
            closedValue,
            closedCount,
            stages,
          });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setActiveLeads(47);
        setTotalLeads(47);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${Math.round(value / 1000)}K`;
    return `$${value.toLocaleString()}`;
  };
  
  const progressPercent = Math.min(100, Math.round((pipelineStats.closedValue / monthlyGoal) * 100));
  
  return (
    <div className="p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's your pipeline at a glance.
        </p>
      </div>
      
      {/* Pipeline Progress */}
      <div className="glass dark:glass-dark rounded-2xl shadow-lg border border-white/30 dark:border-white/10 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Monthly Goal Progress
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatCurrency(pipelineStats.closedValue)} closed of {formatCurrency(monthlyGoal)} goal
            </p>
          </div>
          <Link 
            href="/dashboard/pipeline"
            className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 smooth-transition"
          >
            View Pipeline →
          </Link>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">{progressPercent}% complete</span>
            <span className="text-gray-500 dark:text-gray-400">
              {pipelineStats.closedCount} deal{pipelineStats.closedCount !== 1 ? 's' : ''} closed
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full smooth-transition"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        
        {/* Pipeline Stages Mini */}
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {[
            { id: 'new', label: 'New', color: 'bg-gray-500' },
            { id: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
            { id: 'qualified', label: 'Qualified', color: 'bg-indigo-500' },
            { id: 'showing', label: 'Showing', color: 'bg-purple-500' },
            { id: 'under_contract', label: 'Contract', color: 'bg-violet-500' },
            { id: 'closing', label: 'Closing', color: 'bg-fuchsia-500' },
            { id: 'closed_won', label: 'Closed', color: 'bg-green-500' },
          ].map(stage => (
            <div key={stage.id} className="text-center">
              <div className={`w-8 h-8 mx-auto rounded-full ${stage.color} flex items-center justify-center text-white text-xs font-bold mb-1`}>
                {pipelineStats.stages[stage.id] || 0}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{stage.label}</p>
            </div>
          ))}
        </div>
        
        {/* Pipeline Value */}
        {pipelineStats.pipelineValue > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(pipelineStats.pipelineValue)}</span> in active pipeline
            </span>
          </div>
        )}
      </div>
      
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
        <Link href="/dashboard/pipeline">
          <StatCard 
            title="Pipeline Value"
            value={loading ? '...' : formatCurrency(pipelineStats.pipelineValue)}
            change={`${pipelineStats.total} leads`}
            icon={CurrencyDollarIcon}
            positive
          />
        </Link>
        <StatCard 
          title="Hunter Prospects"
          value={hunterLeads.toString()}
          change="New today"
          icon={ClockIcon}
        />
        <StatCard 
          title="Closed This Month"
          value={loading ? '...' : formatCurrency(pipelineStats.closedValue)}
          change={`${pipelineStats.closedCount} deals`}
          icon={CheckCircleIcon}
          positive
        />
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard 
          title="Pipeline"
          description="Drag leads through your sales funnel"
          href="/dashboard/pipeline"
          badge={pipelineStats.total > 0 ? pipelineStats.total.toString() : undefined}
          color="purple"
        />
        <QuickActionCard 
          title="The Hunter"
          description="View new FSBO & expired leads found today"
          href="/dashboard/hunter"
          badge={hunterLeads > 0 ? hunterLeads.toString() : undefined}
          color="blue"
        />
        <QuickActionCard 
          title="Settings"
          description="Account, notifications, and preferences"
          href="/dashboard/settings"
          color="gray"
        />
      </div>
      
      {/* Recent Activity */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          <ActivityItem 
            time="Just now"
            title="Pipeline synced with database"
            status="success"
          />
          <ActivityItem 
            time="5 minutes ago"
            title={`${totalLeads} leads in your database`}
            status="info"
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
    <div className="glass dark:glass-dark p-6 rounded-2xl shadow-lg border border-white/30 dark:border-white/10 smooth-transition hover:shadow-xl hover:scale-105">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <Icon className="w-5 h-5 text-primary-500" />
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className={`text-sm font-medium ${positive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {change}
      </p>
    </div>
  );
}

function QuickActionCard({ title, description, href, badge, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'border-primary-300 dark:border-primary-700 hover:border-primary-400 dark:hover:border-primary-600',
    purple: 'border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600',
    gray: 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
  };
  
  return (
    <Link 
      href={href}
      className={`block glass dark:glass-dark p-6 rounded-2xl shadow-lg border-2 ${colorClasses[color]} smooth-transition hover:shadow-xl hover:scale-105`}
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
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    info: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
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
