'use client';

import { useState, useEffect } from 'react';
import {
  BoltIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

interface Campaign {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'both';
  status: 'active' | 'paused' | 'draft';
  leads_count: number;
  sent_count: number;
  open_rate: number;
  reply_rate: number;
  steps: CampaignStep[];
  created_at: string;
}

interface CampaignStep {
  id: number;
  day: number;
  type: 'email' | 'sms';
  subject?: string;
  body: string;
}

const STORAGE_KEY = 'agentassist_campaigns';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'both',
  });

  // Load campaigns from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCampaigns(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Save campaigns to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    }
  }, [campaigns, loading]);

  const handleCreate = () => {
    if (!form.name.trim()) return;
    
    const newCampaign: Campaign = {
      id: Date.now(),
      name: form.name,
      type: form.type,
      status: 'draft',
      leads_count: 0,
      sent_count: 0,
      open_rate: 0,
      reply_rate: 0,
      steps: [],
      created_at: new Date().toISOString(),
    };
    
    setCampaigns(prev => [...prev, newCampaign]);
    setForm({ name: '', type: 'email' });
    setShowModal(false);
  };

  const handleToggleStatus = (id: number) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: c.status === 'active' ? 'paused' : 'active' };
      }
      return c;
    }));
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this campaign? This cannot be undone.')) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setForm({ name: campaign.name, type: campaign.type });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCampaign(null);
    setForm({ name: '', type: 'email' });
    setShowModal(true);
  };

  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Drip Campaigns</h1>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl 
              flex items-center gap-2 smooth-transition"
          >
            <PlusIcon className="w-5 h-5" />
            New Campaign
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Automate your follow-up sequences with email and SMS drip campaigns
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass dark:glass-dark p-6 rounded-2xl border border-white/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Campaigns</p>
            <BoltIcon className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
        </div>
        
        <div className="glass dark:glass-dark p-6 rounded-2xl border border-white/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Leads in Campaigns</p>
            <UserGroupIcon className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalLeads}</p>
        </div>
        
        <div className="glass dark:glass-dark p-6 rounded-2xl border border-white/30 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Campaigns</p>
            <ChartBarIcon className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{campaigns.length}</p>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="glass dark:glass-dark rounded-2xl p-12 text-center border border-white/30 dark:border-white/10">
          <BoltIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No campaigns yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first drip campaign to start automating follow-ups with your leads.
          </p>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl 
              inline-flex items-center gap-2 smooth-transition"
          >
            <PlusIcon className="w-5 h-5" />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => (
            <div 
              key={campaign.id}
              className="glass dark:glass-dark rounded-xl p-5 border border-white/30 dark:border-white/10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Campaign Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {campaign.type === 'email' ? (
                      <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                    ) : campaign.type === 'sms' ? (
                      <DevicePhoneMobileIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <BoltIcon className="w-5 h-5 text-purple-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {campaign.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                      ${campaign.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="w-4 h-4" />
                      {campaign.leads_count} leads
                    </span>
                    <span className="flex items-center gap-1">
                      <EnvelopeIcon className="w-4 h-4" />
                      {campaign.sent_count} sent
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {campaign.steps.length} steps
                    </span>
                    {campaign.open_rate > 0 && (
                      <span className="text-green-600 dark:text-green-400">
                        {campaign.open_rate}% open rate
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(campaign.id)}
                    className={`p-2 rounded-lg smooth-transition
                      ${campaign.status === 'active' 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' 
                        : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
                      }`}
                    title={campaign.status === 'active' ? 'Pause' : 'Start'}
                  >
                    {campaign.status === 'active' ? (
                      <PauseIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <PlayIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => openEditModal(campaign)}
                    className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg smooth-transition"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg smooth-transition"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 smooth-transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., New Buyer Follow-up"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                    text-gray-900 dark:text-white placeholder-gray-400
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Campaign Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(f => ({ ...f, type: e.target.value as any }))}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                    text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                >
                  <option value="email">Email Only</option>
                  <option value="sms">SMS Only</option>
                  <option value="both">Email + SMS</option>
                </select>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                After creating the campaign, you'll be able to add follow-up steps with custom timing.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium smooth-transition">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name.trim()}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl 
                  text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed smooth-transition">
                {editingCampaign ? 'Save Changes' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
