'use client';

import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  TrophyIcon,
  ChartBarIcon,
  FireIcon,
  StarIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'leader' | 'member';
  avatar?: string;
  stats: {
    dealsClosedYTD: number;
    dealsClosedMonth: number;
    leadsAdded: number;
    volumeYTD: number;
    activePipeline: number;
  };
  joinedAt: string;
}

interface Goal {
  id: number;
  type: 'deals' | 'volume' | 'leads';
  target: number;
  current: number;
  period: 'yearly' | 'monthly' | 'weekly';
  year: number;
}

const STORAGE_KEY = 'agentassist_team_data';

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'members' | 'goals'>('leaderboard');
  const [teamData, setTeamData] = useState<{
    teamName: string;
    joinCode: string;
    members: TeamMember[];
    goals: Goal[];
  }>({
    teamName: 'The Dream Team',
    joinCode: 'DREAM2026',
    members: [],
    goals: []
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [goalForm, setGoalForm] = useState({
    type: 'deals' as Goal['type'],
    target: '',
    period: 'yearly' as Goal['period']
  });

  // Load data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTeamData(JSON.parse(saved));
    } else {
      // Demo data
      setTeamData({
        teamName: 'The Dream Team',
        joinCode: 'DREAM2026',
        members: [
          { id: 1, name: 'You', email: 'you@email.com', role: 'leader', stats: { dealsClosedYTD: 8, dealsClosedMonth: 2, leadsAdded: 45, volumeYTD: 3200000, activePipeline: 1500000 }, joinedAt: '2026-01-01' },
          { id: 2, name: 'Sarah Johnson', email: 'sarah@email.com', role: 'member', stats: { dealsClosedYTD: 12, dealsClosedMonth: 3, leadsAdded: 67, volumeYTD: 4800000, activePipeline: 2100000 }, joinedAt: '2026-01-15' },
          { id: 3, name: 'Mike Chen', email: 'mike@email.com', role: 'member', stats: { dealsClosedYTD: 6, dealsClosedMonth: 1, leadsAdded: 32, volumeYTD: 2100000, activePipeline: 800000 }, joinedAt: '2026-02-01' },
          { id: 4, name: 'Emily Davis', email: 'emily@email.com', role: 'member', stats: { dealsClosedYTD: 10, dealsClosedMonth: 2, leadsAdded: 55, volumeYTD: 3900000, activePipeline: 1200000 }, joinedAt: '2026-01-20' },
        ],
        goals: [
          { id: 1, type: 'deals', target: 24, current: 8, period: 'yearly', year: 2026 },
          { id: 2, type: 'volume', target: 10000000, current: 3200000, period: 'yearly', year: 2026 },
        ]
      });
    }
    setDataLoaded(true);
  }, []);

  // Save data
  useEffect(() => {
    if (!dataLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teamData));
  }, [teamData, dataLoaded]);

  // Sort members by deals (leaderboard)
  const leaderboard = [...teamData.members].sort((a, b) => b.stats.dealsClosedYTD - a.stats.dealsClosedYTD);

  // Calculate goal progress
  const getGoalProgress = (goal: Goal) => {
    const progress = (goal.current / goal.target) * 100;
    const now = new Date();
    const yearProgress = (now.getMonth() + 1) / 12 * 100;
    const isOnTrack = progress >= yearProgress - 10;
    
    // Calculate required velocity
    const remaining = goal.target - goal.current;
    const monthsLeft = 12 - now.getMonth();
    const requiredPerMonth = remaining / monthsLeft;
    const requiredPerWeek = requiredPerMonth / 4;

    return { progress, isOnTrack, remaining, requiredPerMonth, requiredPerWeek };
  };

  // Add goal
  const addGoal = () => {
    if (!goalForm.target) return;
    
    const newGoal: Goal = {
      id: Date.now(),
      type: goalForm.type,
      target: parseFloat(goalForm.target),
      current: 0,
      period: goalForm.period,
      year: 2026
    };

    setTeamData({ ...teamData, goals: [...teamData.goals, newGoal] });
    setGoalForm({ type: 'deals', target: '', period: 'yearly' });
    setShowGoalModal(false);
  };

  // Copy join code
  const copyJoinCode = () => {
    navigator.clipboard.writeText(teamData.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  // Get rank medal
  const getRankMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center mb-2">
            <UserGroupIcon className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {teamData.teamName}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {teamData.members.length} team members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyJoinCode}
            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors ${
              copiedCode 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <ClipboardDocumentIcon className="w-5 h-5" />
            {copiedCode ? 'Copied!' : `Code: ${teamData.joinCode}`}
          </button>
          <button
            onClick={() => setShowGoalModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Set Goal
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'leaderboard', label: 'Leaderboard', icon: TrophyIcon },
          { id: 'goals', label: 'Goals', icon: ChartBarIcon },
          { id: 'members', label: 'Members', icon: UserGroupIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {leaderboard.slice(0, 3).map((member, index) => (
              <div
                key={member.id}
                className={`glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10 text-center ${
                  index === 0 ? 'ring-2 ring-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20' : ''
                }`}
              >
                <div className="text-4xl mb-2">{getRankMedal(index)}</div>
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 my-2">
                  {member.stats.dealsClosedYTD}
                </p>
                <p className="text-sm text-gray-500">deals closed</p>
                <p className="text-sm text-green-600 mt-1">
                  {formatCurrency(member.stats.volumeYTD)} volume
                </p>
              </div>
            ))}
          </div>

          {/* Full Rankings */}
          <div className="glass dark:glass-dark rounded-2xl border border-white/30 dark:border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Deals (YTD)</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">This Month</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Leads Added</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaderboard.map((member, index) => (
                  <tr key={member.id} className={index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                    <td className="px-6 py-4 text-2xl">{getRankMedal(index)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role === 'leader' ? '👑 Team Lead' : 'Agent'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">
                      {member.stats.dealsClosedYTD}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        member.stats.dealsClosedMonth >= 2 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {member.stats.dealsClosedMonth}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                      {member.stats.leadsAdded}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      {formatCurrency(member.stats.volumeYTD)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {teamData.goals.length === 0 ? (
            <div className="glass dark:glass-dark rounded-2xl p-12 text-center border border-white/30 dark:border-white/10">
              <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Goals Set
              </h3>
              <p className="text-gray-500 mb-6">
                Set your first goal to track your progress
              </p>
              <button
                onClick={() => setShowGoalModal(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Set a Goal
              </button>
            </div>
          ) : (
            teamData.goals.map((goal) => {
              const { progress, isOnTrack, remaining, requiredPerMonth, requiredPerWeek } = getGoalProgress(goal);
              const goalLabel = goal.type === 'deals' ? 'Deals' : goal.type === 'volume' ? 'Volume' : 'Leads';
              
              return (
                <div key={goal.id} className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {goal.type === 'deals' && <TrophyIcon className="w-6 h-6 text-yellow-500" />}
                        {goal.type === 'volume' && <CurrencyDollarIcon className="w-6 h-6 text-green-500" />}
                        {goal.type === 'leads' && <UserPlusIcon className="w-6 h-6 text-blue-500" />}
                        {goal.target} {goalLabel} Goal
                      </h3>
                      <p className="text-sm text-gray-500">{goal.year} {goal.period}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isOnTrack 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {isOnTrack ? '✓ On Track' : '⚠ Behind'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {goal.type === 'volume' ? formatCurrency(goal.current) : goal.current} of {goal.type === 'volume' ? formatCurrency(goal.target) : goal.target}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${isOnTrack ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Velocity Required */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {goal.type === 'volume' ? formatCurrency(remaining) : remaining}
                      </p>
                      <p className="text-xs text-gray-500">remaining</p>
                    </div>
                    <div className="text-center border-x border-gray-200 dark:border-gray-600">
                      <p className="text-2xl font-bold text-primary-600">
                        {goal.type === 'volume' ? formatCurrency(requiredPerMonth) : requiredPerMonth.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500">per month needed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-500">
                        {goal.type === 'volume' ? formatCurrency(requiredPerWeek) : requiredPerWeek.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500">per week needed</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {teamData.members.map((member) => (
            <div key={member.id} className="glass dark:glass-dark rounded-xl p-5 border border-white/30 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {member.name}
                    {member.role === 'leader' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Team Lead</span>}
                  </p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-gray-900 dark:text-white">{member.stats.dealsClosedYTD}</p>
                  <p className="text-gray-500">deals</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-green-600">{formatCurrency(member.stats.volumeYTD)}</p>
                  <p className="text-gray-500">volume</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-600">{formatCurrency(member.stats.activePipeline)}</p>
                  <p className="text-gray-500">pipeline</p>
                </div>
              </div>
            </div>
          ))}

          {/* Invite CTA */}
          <div className="glass dark:glass-dark rounded-xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
            <UserPlusIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">Invite team members with code:</p>
            <code className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-lg font-mono">
              {teamData.joinCode}
            </code>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Set a Goal
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'deals', label: 'Deals', icon: TrophyIcon },
                    { id: 'volume', label: 'Volume', icon: CurrencyDollarIcon },
                    { id: 'leads', label: 'Leads', icon: UserPlusIcon },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setGoalForm({ ...goalForm, type: type.id as Goal['type'] })}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-colors ${
                        goalForm.type === type.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <type.icon className="w-6 h-6" />
                      <span className="text-sm">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target
                </label>
                <input
                  type="number"
                  placeholder={goalForm.type === 'volume' ? '10000000' : '24'}
                  value={goalForm.target}
                  onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {goalForm.type === 'volume' ? 'Enter dollar amount (e.g., 10000000 for $10M)' : 'Number of ' + goalForm.type}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period
                </label>
                <select
                  value={goalForm.period}
                  onChange={(e) => setGoalForm({ ...goalForm, period: e.target.value as Goal['period'] })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  <option value="yearly">Yearly (2026)</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Set Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
