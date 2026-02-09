'use client';

import { useState, useEffect, useCallback, DragEvent } from 'react';
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PlusIcon,
  XMarkIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

const STAGES = [
  { id: 'new', name: 'New', color: 'gray', statuses: ['New', 'Cold', null, ''] },
  { id: 'contacted', name: 'Contacted', color: 'blue', statuses: ['Contacted'] },
  { id: 'qualified', name: 'Qualified', color: 'indigo', statuses: ['Qualified'] },
  { id: 'showing', name: 'Showing', color: 'purple', statuses: ['Active', 'Showing'] },
  { id: 'under_contract', name: 'Under Contract', color: 'violet', statuses: ['Under Contract'] },
  { id: 'closing', name: 'Closing', color: 'fuchsia', statuses: ['Closing'] },
  { id: 'closed_won', name: 'Closed', color: 'green', statuses: ['Closed', 'Closed Won'] },
];

const stageColors: Record<string, string> = {
  gray: 'border-t-gray-500',
  blue: 'border-t-blue-500',
  indigo: 'border-t-indigo-500',
  purple: 'border-t-purple-500',
  violet: 'border-t-violet-500',
  fuchsia: 'border-t-fuchsia-500',
  green: 'border-t-green-500',
};

// Map stage ID back to a status string for the API
const stageToStatus: Record<string, string> = {
  'new': 'New',
  'contacted': 'Contacted',
  'qualified': 'Qualified',
  'showing': 'Active',
  'under_contract': 'Under Contract',
  'closing': 'Closing',
  'closed_won': 'Closed',
};

interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  location: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  tags: string[];
  created_at?: string;
}

interface PipelineLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage: string;
  deal_value: number | null;
  property_address: string | null;
  lead_type: 'buyer' | 'seller' | 'both';
  priority: 'hot' | 'warm' | 'cold';
  originalStatus: string | null;
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<PipelineLead | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    stage: 'new',
    deal_value: '',
    property_address: '',
    lead_type: 'buyer' as 'buyer' | 'seller' | 'both',
    priority: 'warm' as 'hot' | 'warm' | 'cold',
  });

  // Convert API lead to pipeline lead
  const transformLead = (lead: Lead): PipelineLead => {
    const stage = STAGES.find(s => s.statuses.includes(lead.status || ''))?.id || 'new';
    const score = calculateScore(lead);
    
    return {
      id: lead.id,
      name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
      email: lead.email,
      phone: lead.phone,
      stage,
      deal_value: lead.price_range_max || null,
      property_address: lead.location || null,
      lead_type: 'buyer',
      priority: score >= 70 ? 'hot' : score >= 50 ? 'warm' : 'cold',
      originalStatus: lead.status,
    };
  };

  const calculateScore = (lead: Lead): number => {
    let score = 30;
    if (lead.email) score += 10;
    if (lead.phone) score += 15;
    if (lead.price_range_max) score += 10;
    if (lead.status === 'Qualified') score += 20;
    else if (lead.status === 'Active') score += 15;
    return score;
  };

  // Fetch leads from API
  const fetchLeads = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setSyncing(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
      const response = await fetch(`${apiUrl}/api/leads?limit=200`);
      const data = await response.json();

      if (data.success && data.leads) {
        const pipelineLeads = data.leads.map(transformLead);
        setLeads(pipelineLeads);
        setLastSync(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
    
    setLoading(false);
    setSyncing(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  // Update lead status in database when dropped
  const updateLeadStatus = async (leadId: string, newStage: string) => {
    const newStatus = stageToStatus[newStage];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
    
    try {
      const response = await fetch(`${apiUrl}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        console.error('Failed to update lead status');
        // Refresh to get correct state
        fetchLeads(false);
      }
    } catch (err) {
      console.error('Error updating lead:', err);
      fetchLeads(false);
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(leadId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, newStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    setDragOverStage(null);
    setDraggingId(null);

    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.stage !== newStage) {
      // Optimistic update
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, stage: newStage } : l
      ));
      // Persist to database
      updateLeadStatus(leadId, newStage);
    }
  };

  const totalLeads = leads.length;
  const pipelineValue = leads.filter(l => l.stage !== 'closed_won').reduce((sum, l) => sum + (l.deal_value || 0), 0);
  const closedWon = leads.filter(l => l.stage === 'closed_won').length;
  const closedValue = leads.filter(l => l.stage === 'closed_won').reduce((sum, l) => sum + (l.deal_value || 0), 0);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${Math.round(value / 1000)}K`;
    return `$${value.toLocaleString()}`;
  };

  const getLeadsForStage = (stageId: string) => leads.filter(l => l.stage === stageId);
  const getStageValue = (stageId: string) => leads.filter(l => l.stage === stageId).reduce((sum, l) => sum + (l.deal_value || 0), 0);

  const openEditModal = (lead: PipelineLead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name, email: lead.email || '', phone: lead.phone || '',
      stage: lead.stage, deal_value: lead.deal_value?.toString() || '',
      property_address: lead.property_address || '',
      lead_type: lead.lead_type, priority: lead.priority,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingLead || !formData.name.trim()) return;

    // Update local state
    setLeads(prev => prev.map(lead => {
      if (lead.id === editingLead.id) {
        return { ...lead, stage: formData.stage };
      }
      return lead;
    }));

    // If stage changed, update in database
    if (formData.stage !== editingLead.stage) {
      await updateLeadStatus(editingLead.id, formData.stage);
    }

    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pipeline</h1>
          </div>
          <button
            onClick={() => fetchLeads(false)}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 
              hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 
              rounded-lg smooth-transition disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Live sync with your leads • {lastSync && `Last updated ${lastSync.toLocaleTimeString()}`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Leads" value={totalLeads.toString()} icon={UserGroupIcon} />
        <StatCard title="Pipeline Value" value={formatCurrency(pipelineValue)} icon={CurrencyDollarIcon} positive />
        <StatCard title="Closed Won" value={closedWon.toString()} icon={CheckCircleIcon} positive />
        <StatCard title="Closed Value" value={formatCurrency(closedValue)} icon={ArrowTrendingUpIcon} positive />
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-6 px-6 pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => {
            const stageLeads = getLeadsForStage(stage.id);
            const stageValue = getStageValue(stage.id);
            const isDropTarget = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`w-72 flex-shrink-0 glass dark:glass-dark rounded-2xl shadow-lg smooth-transition
                  border-t-4 ${stageColors[stage.color]}
                  ${isDropTarget ? 'scale-[1.02] shadow-xl ring-2 ring-primary-500' : ''}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{stage.name}</h3>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-medium">
                      {stageLeads.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                      {formatCurrency(stageValue)}
                    </p>
                  )}
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 min-h-[150px] max-h-[55vh] overflow-y-auto">
                  {stageLeads.map(lead => {
                    const isDragging = draggingId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openEditModal(lead)}
                        className={`bg-white dark:bg-gray-800 rounded-xl p-4 cursor-grab active:cursor-grabbing
                          border border-gray-200 dark:border-gray-700 
                          smooth-transition hover:shadow-lg hover:scale-[1.02]
                          ${isDragging ? 'opacity-50 scale-95' : ''}`}
                      >
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0
                              ${lead.priority === 'hot' ? 'bg-red-500' : 
                                lead.priority === 'warm' ? 'bg-yellow-500' : 'bg-gray-400'}`} 
                            />
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                              {lead.name}
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 uppercase
                            ${lead.lead_type === 'buyer' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                              : lead.lead_type === 'seller'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {lead.lead_type === 'buyer' ? 'Buy' : lead.lead_type === 'seller' ? 'Sell' : 'Both'}
                          </span>
                        </div>

                        {/* Property Address */}
                        {lead.property_address && (
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-3">
                            <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <p className="text-xs truncate">{lead.property_address}</p>
                          </div>
                        )}

                        {/* Footer Row */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            {lead.deal_value ? (
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(lead.deal_value)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">No value</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 smooth-transition">
                                <PhoneIcon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                              </a>
                            )}
                            {lead.email && (
                              <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 smooth-transition">
                                <EnvelopeIcon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500 
                      border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      <p className="text-sm">Drop leads here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Live Sync:</strong> This pipeline syncs with your leads database. Drag cards between columns to update lead status. 
          New leads from CSV imports, Open Houses, or anywhere else appear automatically.
        </p>
      </div>

      {/* Modal */}
      {showModal && editingLead && (
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
                {editingLead.name}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 smooth-transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Contact Info */}
              <div className="flex gap-3">
                {editingLead.phone && (
                  <a href={`tel:${editingLead.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 
                      rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 smooth-transition">
                    <PhoneIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Call</span>
                  </a>
                )}
                {editingLead.email && (
                  <a href={`mailto:${editingLead.email}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 
                      rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 smooth-transition">
                    <EnvelopeIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Email</span>
                  </a>
                )}
              </div>

              {/* Stage Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData(f => ({ ...f, stage: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 
                    text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none smooth-transition"
                >
                  {STAGES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Details */}
              {editingLead.property_address && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="w-4 h-4" />
                  <span className="text-sm">{editingLead.property_address}</span>
                </div>
              )}
              
              {editingLead.deal_value && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{formatCurrency(editingLead.deal_value)} estimated value</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium smooth-transition">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl 
                  text-sm font-semibold smooth-transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, positive }: { title: string; value: string; icon: any; positive?: boolean }) {
  return (
    <div className="glass dark:glass-dark p-6 rounded-2xl shadow-lg border border-white/30 dark:border-white/10 smooth-transition hover:shadow-xl hover:scale-105">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <Icon className="w-5 h-5 text-primary-500" />
      </div>
      <p className={`text-3xl font-bold ${positive ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  );
}
