'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserGroupIcon,
  BeakerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';
import { fetchWithAuth } from '@/lib/auth';

interface CampaignStep {
  id: number;
  step_order: number;
  delay_days: number;
  type: string;
  subject: string | null;
  body: string;
  sent_count: number;
}

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
  leads_count: number;
  sent_count: number;
  steps: CampaignStep[];
  created_at: string;
}

interface Enrollment {
  id: number;
  lead_id: number;
  status: string;
  current_step: number;
  enrolled_at: string;
  lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<{ [key: number]: Enrollment[] }>({});
  const [sending, setSending] = useState<number | null>(null);
  const [sendResult, setSendResult] = useState<string | null>(null);
  
  // New step form
  const [showStepModal, setShowStepModal] = useState<number | null>(null);
  const [stepForm, setStepForm] = useState({
    subject: '',
    body: '',
    delay_days: 0,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';

  const fetchCampaigns = async () => {
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/campaigns/`);
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      } else {
        setError(data.detail || 'Failed to load');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (campaignId: number) => {
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/campaigns/${campaignId}/enrollments`);
      const data = await res.json();
      if (data.success) {
        setEnrollments(prev => ({ ...prev, [campaignId]: data.enrollments }));
      }
    } catch (err) {
      console.error('Fetch enrollments error:', err);
    }
  };

  const createCampaign = async () => {
    if (!newCampaignName.trim()) return;
    setCreating(true);

    try {
      const res = await fetchWithAuth(`${apiUrl}/api/campaigns/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaignName,
          type: 'email',
          steps: [],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewCampaignName('');
        setShowModal(false);
        fetchCampaigns();
      } else {
        alert(data.detail || 'Failed to create');
      }
    } catch (err) {
      console.error('Create error:', err);
      alert('Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('Delete this campaign and all its steps?')) return;

    try {
      await fetchWithAuth(`${apiUrl}/api/campaigns/${id}`, { method: 'DELETE' });
      fetchCampaigns();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    try {
      await fetchWithAuth(`${apiUrl}/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchCampaigns();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const addStep = async (campaignId: number) => {
    if (!stepForm.subject.trim() || !stepForm.body.trim()) {
      alert('Subject and body are required');
      return;
    }

    const campaign = campaigns.find(c => c.id === campaignId);
    const nextOrder = (campaign?.steps?.length || 0) + 1;

    try {
      const res = await fetchWithAuth(`${apiUrl}/api/campaigns/${campaignId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_order: nextOrder,
          delay_days: stepForm.delay_days,
          type: 'email',
          subject: stepForm.subject,
          body: stepForm.body,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStepForm({ subject: '', body: '', delay_days: 0 });
        setShowStepModal(null);
        fetchCampaigns();
      } else {
        alert(data.detail || 'Failed to add step');
      }
    } catch (err) {
      console.error('Add step error:', err);
      alert('Failed to add step');
    }
  };

  const deleteStep = async (campaignId: number, stepId: number) => {
    if (!confirm('Delete this step?')) return;

    try {
      await fetchWithAuth(`${apiUrl}/api/campaigns/${campaignId}/steps/${stepId}`, {
        method: 'DELETE',
      });
      fetchCampaigns();
    } catch (err) {
      console.error('Delete step error:', err);
    }
  };

  const sendEmails = async (campaignId: number) => {
    setSending(campaignId);
    setSendResult(null);

    try {
      const res = await fetchWithAuth(`${apiUrl}/api/campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success) {
        setSendResult(`✅ Sent ${data.sent_count} email(s)!`);
        fetchCampaigns();
        fetchEnrollments(campaignId);
      } else {
        setSendResult(`❌ ${data.detail || 'Failed to send'}`);
      }
    } catch (err: any) {
      console.error('Send error:', err);
      setSendResult(`❌ Error: ${err.message}`);
    } finally {
      setSending(null);
    }
  };

  const sendTestEmail = async (campaignId: number) => {
    try {
      const res = await fetchWithAuth(`${apiUrl}/api/campaigns/${campaignId}/send-test`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Test email sent to ${data.message.split('to ')[1] || 'your email'}`);
      } else {
        alert(`❌ ${data.detail || 'Failed to send test'}`);
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const toggleExpand = (id: number) => {
    if (expandedCampaign === id) {
      setExpandedCampaign(null);
    } else {
      setExpandedCampaign(id);
      fetchEnrollments(id);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Campaigns
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Create email drip campaigns and send to enrolled leads
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
          >
            <PlusIcon className="w-5 h-5" />
            New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {sendResult && (
          <div className={`mb-6 p-4 rounded-xl ${sendResult.startsWith('✅') ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
            {sendResult}
          </div>
        )}

        {campaigns.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <EnvelopeIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first email campaign
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Campaign Header */}
                <div className="p-6 flex items-center justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(campaign.id)}>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {campaign.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        campaign.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : campaign.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {campaign.steps?.length || 0} step(s) • {campaign.leads_count || 0} enrolled • {campaign.sent_count || 0} sent
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Send Emails Button */}
                    <button
                      onClick={() => sendEmails(campaign.id)}
                      disabled={sending === campaign.id || campaign.status !== 'active' || !campaign.steps?.length}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={campaign.status !== 'active' ? 'Set campaign to active first' : 'Send pending emails'}
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                      {sending === campaign.id ? 'Sending...' : 'Send'}
                    </button>
                    
                    {/* Test Email */}
                    <button
                      onClick={() => sendTestEmail(campaign.id)}
                      disabled={!campaign.steps?.length}
                      className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 disabled:opacity-50"
                      title="Send test email to yourself"
                    >
                      <BeakerIcon className="w-5 h-5" />
                    </button>
                    
                    {/* Toggle Status */}
                    <button
                      onClick={() => toggleStatus(campaign.id, campaign.status)}
                      className={`p-2 rounded-lg ${
                        campaign.status === 'active'
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={campaign.status === 'active' ? 'Pause campaign' : 'Activate campaign'}
                    >
                      {campaign.status === 'active' ? (
                        <PauseIcon className="w-5 h-5" />
                      ) : (
                        <PlayIcon className="w-5 h-5" />
                      )}
                    </button>
                    
                    {/* Delete */}
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                    
                    {/* Expand */}
                    <button
                      onClick={() => toggleExpand(campaign.id)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    >
                      {expandedCampaign === campaign.id ? (
                        <ChevronUpIcon className="w-5 h-5" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCampaign === campaign.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {/* Steps Section */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <EnvelopeIcon className="w-5 h-5" />
                          Email Steps
                        </h4>
                        <button
                          onClick={() => setShowStepModal(campaign.id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Add Step
                        </button>
                      </div>
                      
                      {!campaign.steps?.length ? (
                        <p className="text-gray-500 text-sm">No steps yet. Add your first email step!</p>
                      ) : (
                        <div className="space-y-3">
                          {campaign.steps
                            .sort((a, b) => a.step_order - b.step_order)
                            .map((step) => (
                            <div key={step.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded text-sm font-medium">
                                      Step {step.step_order}
                                    </span>
                                    {step.delay_days > 0 && (
                                      <span className="text-xs text-gray-500">
                                        +{step.delay_days} day(s) delay
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400">
                                      {step.sent_count} sent
                                    </span>
                                  </div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {step.subject || '(No subject)'}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {step.body}
                                  </p>
                                </div>
                                <button
                                  onClick={() => deleteStep(campaign.id, step.id)}
                                  className="ml-4 p-1 text-red-500 hover:text-red-700"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Enrolled Leads Section */}
                    <div className="p-6">
                      <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <UserGroupIcon className="w-5 h-5" />
                        Enrolled Leads ({enrollments[campaign.id]?.length || 0})
                      </h4>
                      
                      {!enrollments[campaign.id]?.length ? (
                        <p className="text-gray-500 text-sm">
                          No leads enrolled yet. Go to Leads page and click "Start Campaign" on a lead.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {enrollments[campaign.id].map((enrollment) => (
                            <div key={enrollment.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {enrollment.lead?.first_name} {enrollment.lead?.last_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {enrollment.lead?.email} • Step {enrollment.current_step}/{campaign.steps?.length || 0}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                enrollment.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : enrollment.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {enrollment.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Campaign Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Create Campaign
              </h2>
              <input
                type="text"
                placeholder="Campaign name"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl mb-4 text-gray-900 dark:text-white"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={createCampaign}
                  disabled={creating || !newCampaignName.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Step Modal */}
        {showStepModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add Email Step
                </h2>
                <button onClick={() => setShowStepModal(null)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    placeholder="Hi {{first_name}}, checking in..."
                    value={stepForm.subject}
                    onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Body *
                  </label>
                  <textarea
                    placeholder="Hi {{first_name}},&#10;&#10;I wanted to reach out about..."
                    value={stepForm.body}
                    onChange={(e) => setStepForm({ ...stepForm, body: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Placeholders: {'{{first_name}}'}, {'{{last_name}}'}, {'{{email}}'}, {'{{phone}}'}, {'{{location}}'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delay (days after previous step)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stepForm.delay_days}
                    onChange={(e) => setStepForm({ ...stepForm, delay_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0 = send immediately when campaign is processed
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowStepModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addStep(showStepModal)}
                  disabled={!stepForm.subject.trim() || !stepForm.body.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl disabled:opacity-50"
                >
                  Add Step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
