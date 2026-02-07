'use client';

import { useState, useEffect } from 'react';
import {
  BoltIcon,
  PlusIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  PencilIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

interface CampaignStep {
  id: number;
  type: 'email' | 'sms';
  delayDays: number;
  subject?: string;
  message: string;
}

interface Campaign {
  id: number;
  name: string;
  description?: string;
  trigger: 'new_lead' | 'open_house' | 'no_response' | 'manual';
  steps: CampaignStep[];
  isActive: boolean;
  leadsEnrolled: number;
  messagessSent: number;
  createdAt: string;
}

const STORAGE_KEY = 'agentassist_campaigns';

const TRIGGER_LABELS = {
  new_lead: 'New Lead Added',
  open_house: 'Open House Sign-in',
  no_response: 'No Response (3 days)',
  manual: 'Manual Enrollment'
};

const TEMPLATES = {
  new_lead: [
    { type: 'email' as const, delayDays: 0, subject: 'Thanks for your interest!', message: "Hi {{first_name}},\n\nThank you for reaching out! I'd love to help you with your real estate needs.\n\nWhen would be a good time for a quick call to discuss what you're looking for?\n\nBest,\n{{agent_name}}" },
    { type: 'sms' as const, delayDays: 1, message: "Hi {{first_name}}! This is {{agent_name}}. Just following up on your inquiry. Would you like to schedule a quick call this week?" },
    { type: 'email' as const, delayDays: 3, subject: 'Still interested in finding your dream home?', message: "Hi {{first_name}},\n\nI wanted to check in and see if you're still looking for a home. I've got some great listings that might match what you're looking for.\n\nLet me know if you'd like me to send some options!\n\nBest,\n{{agent_name}}" },
    { type: 'sms' as const, delayDays: 7, message: "Hey {{first_name}}, just checking in! Still looking for a home? I'm here to help whenever you're ready. - {{agent_name}}" },
  ],
  open_house: [
    { type: 'email' as const, delayDays: 0, subject: 'Great meeting you today!', message: "Hi {{first_name}},\n\nIt was wonderful meeting you at the open house at {{property_address}}!\n\nI'd love to hear your thoughts on the property. Would you like to schedule a private showing or see similar homes?\n\nBest,\n{{agent_name}}" },
    { type: 'sms' as const, delayDays: 1, message: "Hi {{first_name}}! Thanks for visiting the open house yesterday. Any questions about the property? Happy to help! - {{agent_name}}" },
    { type: 'email' as const, delayDays: 4, subject: 'Similar homes you might love', message: "Hi {{first_name}},\n\nBased on your visit to {{property_address}}, I thought you might be interested in these similar listings:\n\n[Similar listings would be inserted here]\n\nWould you like to tour any of these?\n\nBest,\n{{agent_name}}" },
  ],
  no_response: [
    { type: 'sms' as const, delayDays: 0, message: "Hi {{first_name}}, I haven't heard back from you. Still interested in buying/selling? Let me know how I can help! - {{agent_name}}" },
    { type: 'email' as const, delayDays: 2, subject: 'Checking in', message: "Hi {{first_name}},\n\nI wanted to reach out one more time. I understand life gets busy!\n\nIf now isn't the right time, no worries at all. Feel free to reach out whenever you're ready.\n\nBest,\n{{agent_name}}" },
  ],
  manual: []
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showStepModal, setShowStepModal] = useState<{ campaignId: number; step?: CampaignStep } | null>(null);

  // Create form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    trigger: 'new_lead' as Campaign['trigger']
  });

  // Step form state
  const [stepForm, setStepForm] = useState({
    type: 'email' as 'email' | 'sms',
    delayDays: '1',
    subject: '',
    message: ''
  });

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCampaigns(JSON.parse(saved));
    } else {
      // Create default campaign
      const defaultCampaign: Campaign = {
        id: 1,
        name: 'New Lead Welcome',
        description: 'Automated follow-up for all new leads',
        trigger: 'new_lead',
        steps: TEMPLATES.new_lead.map((t, i) => ({ id: i + 1, ...t })),
        isActive: true,
        leadsEnrolled: 12,
        messagessSent: 38,
        createdAt: new Date().toISOString()
      };
      setCampaigns([defaultCampaign]);
    }
    setDataLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!dataLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  }, [campaigns, dataLoaded]);

  // Create campaign
  const createCampaign = () => {
    if (!newCampaign.name) {
      alert('Please enter a campaign name');
      return;
    }

    const campaign: Campaign = {
      id: Date.now(),
      name: newCampaign.name,
      description: newCampaign.description || undefined,
      trigger: newCampaign.trigger,
      steps: TEMPLATES[newCampaign.trigger].map((t, i) => ({ id: Date.now() + i, ...t })),
      isActive: false,
      leadsEnrolled: 0,
      messagessSent: 0,
      createdAt: new Date().toISOString()
    };

    setCampaigns([campaign, ...campaigns]);
    setNewCampaign({ name: '', description: '', trigger: 'new_lead' });
    setShowCreateModal(false);
  };

  // Toggle campaign active state
  const toggleCampaign = (id: number) => {
    setCampaigns(campaigns.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ));
  };

  // Delete campaign
  const deleteCampaign = (id: number) => {
    if (confirm('Delete this campaign?')) {
      setCampaigns(campaigns.filter(c => c.id !== id));
    }
  };

  // Add/Edit step
  const saveStep = () => {
    if (!showStepModal || !stepForm.message) {
      alert('Please enter a message');
      return;
    }

    const newStep: CampaignStep = {
      id: showStepModal.step?.id || Date.now(),
      type: stepForm.type,
      delayDays: parseInt(stepForm.delayDays) || 0,
      subject: stepForm.type === 'email' ? stepForm.subject : undefined,
      message: stepForm.message
    };

    setCampaigns(campaigns.map(c => {
      if (c.id !== showStepModal.campaignId) return c;
      
      if (showStepModal.step) {
        // Editing existing step
        return { ...c, steps: c.steps.map(s => s.id === showStepModal.step!.id ? newStep : s) };
      } else {
        // Adding new step
        return { ...c, steps: [...c.steps, newStep] };
      }
    }));

    setShowStepModal(null);
    setStepForm({ type: 'email', delayDays: '1', subject: '', message: '' });
  };

  // Delete step
  const deleteStep = (campaignId: number, stepId: number) => {
    setCampaigns(campaigns.map(c => 
      c.id === campaignId 
        ? { ...c, steps: c.steps.filter(s => s.id !== stepId) }
        : c
    ));
  };

  // Open edit step modal
  const editStep = (campaignId: number, step: CampaignStep) => {
    setStepForm({
      type: step.type,
      delayDays: step.delayDays.toString(),
      subject: step.subject || '',
      message: step.message
    });
    setShowStepModal({ campaignId, step });
  };

  // Stats
  const totalActive = campaigns.filter(c => c.isActive).length;
  const totalEnrolled = campaigns.reduce((sum, c) => sum + c.leadsEnrolled, 0);
  const totalSent = campaigns.reduce((sum, c) => sum + c.messagessSent, 0);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center mb-2">
            <BoltIcon className="w-8 h-8 text-yellow-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Campaigns
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Automated follow-up sequences for your leads
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass dark:glass-dark rounded-2xl p-5 border border-white/30 dark:border-white/10">
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">Active Campaigns</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">{totalActive}</p>
        </div>
        <div className="glass dark:glass-dark rounded-2xl p-5 border border-white/30 dark:border-white/10">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Leads Enrolled</p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{totalEnrolled}</p>
        </div>
        <div className="glass dark:glass-dark rounded-2xl p-5 border border-white/30 dark:border-white/10">
          <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Messages Sent</p>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{totalSent}</p>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-6">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10"
          >
            {/* Campaign Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleCampaign(campaign.id)}
                  className={`p-3 rounded-xl transition-colors ${
                    campaign.isActive 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {campaign.isActive ? <PlayIcon className="w-6 h-6" /> : <PauseIcon className="w-6 h-6" />}
                </button>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {campaign.name}
                  </h3>
                  {campaign.description && (
                    <p className="text-gray-500 text-sm mt-1">{campaign.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className={`px-2 py-1 rounded-full ${
                      campaign.isActive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {campaign.isActive ? '● Active' : '○ Paused'}
                    </span>
                    <span className="text-gray-500">
                      Trigger: {TRIGGER_LABELS[campaign.trigger]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right text-sm mr-4">
                  <p className="text-gray-500">{campaign.leadsEnrolled} enrolled</p>
                  <p className="text-gray-500">{campaign.messagessSent} sent</p>
                </div>
                <button
                  onClick={() => deleteCampaign(campaign.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Campaign Steps */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Sequence Steps</h4>
                <button
                  onClick={() => {
                    setStepForm({ type: 'email', delayDays: '1', subject: '', message: '' });
                    setShowStepModal({ campaignId: campaign.id });
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Step
                </button>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-4">
                  {campaign.steps.map((step, index) => (
                    <div key={step.id} className="relative flex items-start gap-4 pl-2">
                      {/* Timeline dot */}
                      <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center ${
                        step.type === 'email' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' 
                          : 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      }`}>
                        {step.type === 'email' 
                          ? <EnvelopeIcon className="w-4 h-4" />
                          : <DevicePhoneMobileIcon className="w-4 h-4" />
                        }
                      </div>

                      {/* Step content */}
                      <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white capitalize">
                                {step.type}
                              </span>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {step.delayDays === 0 ? 'Immediately' : `Day ${step.delayDays}`}
                              </span>
                            </div>
                            {step.subject && (
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Subject: {step.subject}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-line line-clamp-2">
                              {step.message}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => editStep(campaign.id, step)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteStep(campaign.id, step.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {campaign.steps.length === 0 && (
                    <p className="text-gray-500 text-center py-4 pl-12">
                      No steps yet. Add your first step to build the sequence.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && (
          <div className="glass dark:glass-dark rounded-2xl p-12 text-center border border-white/30 dark:border-white/10">
            <BoltIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Campaigns Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first automated follow-up campaign
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              Create Campaign
            </button>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Create Campaign
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., New Lead Welcome Sequence"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="What does this campaign do?"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trigger
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(TRIGGER_LABELS) as Campaign['trigger'][]).map((trigger) => (
                    <button
                      key={trigger}
                      onClick={() => setNewCampaign({ ...newCampaign, trigger })}
                      className={`p-3 rounded-xl border-2 text-left transition-colors ${
                        newCampaign.trigger === trigger
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {TRIGGER_LABELS[trigger]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {newCampaign.trigger !== 'manual' && (
                <p className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                  💡 This will pre-populate with a template sequence. You can customize the messages after creation.
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCampaign}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Step Modal */}
      {showStepModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {showStepModal.step ? 'Edit Step' : 'Add Step'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStepForm({ ...stepForm, type: 'email' })}
                    className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
                      stepForm.type === 'email'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <EnvelopeIcon className="w-5 h-5" />
                    Email
                  </button>
                  <button
                    onClick={() => setStepForm({ ...stepForm, type: 'sms' })}
                    className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
                      stepForm.type === 'sms'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <DevicePhoneMobileIcon className="w-5 h-5" />
                    SMS
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Send After (days)
                </label>
                <select
                  value={stepForm.delayDays}
                  onChange={(e) => setStepForm({ ...stepForm, delayDays: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                >
                  <option value="0">Immediately</option>
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>

              {stepForm.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    placeholder="Email subject..."
                    value={stepForm.subject}
                    onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message *
                </label>
                <textarea
                  placeholder="Your message..."
                  value={stepForm.message}
                  onChange={(e) => setStepForm({ ...stepForm, message: e.target.value })}
                  rows={stepForm.type === 'email' ? 6 : 3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables: {'{{first_name}}'}, {'{{agent_name}}'}, {'{{property_address}}'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStepModal(null)}
                className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveStep}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                {showStepModal.step ? 'Save Changes' : 'Add Step'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
