'use client';

import { useState, useEffect, DragEvent } from 'react';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PlusIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

// Pipeline stages
const STAGES = [
  { id: 'new', name: '🆕 New Leads', color: 'border-purple-500', bgHover: 'bg-purple-500/10' },
  { id: 'contacted', name: '📞 Contacted', color: 'border-blue-500', bgHover: 'bg-blue-500/10' },
  { id: 'qualified', name: '✅ Qualified', color: 'border-cyan-500', bgHover: 'bg-cyan-500/10' },
  { id: 'showing', name: '🏠 Showing', color: 'border-amber-500', bgHover: 'bg-amber-500/10' },
  { id: 'under_contract', name: '📝 Under Contract', color: 'border-orange-500', bgHover: 'bg-orange-500/10' },
  { id: 'closing', name: '🔑 Closing', color: 'border-emerald-500', bgHover: 'bg-emerald-500/10' },
  { id: 'closed_won', name: '🎉 Closed Won', color: 'border-green-500', bgHover: 'bg-green-500/10' },
];

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
  stage_entered_at: string; // ISO date
  created_at: string;
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
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

  // Load leads from localStorage (demo mode) or backend
  useEffect(() => {
    const loadLeads = async () => {
      try {
        // Try to load from localStorage first (demo persistence)
        const stored = localStorage.getItem('pipeline_leads');
        if (stored) {
          setLeads(JSON.parse(stored));
          setLoading(false);
          return;
        }

        // Otherwise, fetch from backend and transform
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/leads?limit=100`);
        const data = await response.json();

        if (data.success && data.leads) {
          // Transform leads to pipeline format
          const pipelineLeads: PipelineLead[] = data.leads.map((lead: any) => ({
            id: lead.id,
            name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
            email: lead.email,
            phone: lead.phone,
            stage: mapStatusToStage(lead.status),
            deal_value: lead.price_range_max || null,
            property_address: lead.location || null,
            lead_type: 'buyer',
            priority: getPriorityFromScore(lead),
            stage_entered_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }));
          setLeads(pipelineLeads);
          localStorage.setItem('pipeline_leads', JSON.stringify(pipelineLeads));
        }
      } catch (err) {
        console.error('Failed to load pipeline leads:', err);
      }
      setLoading(false);
    };

    loadLeads();
  }, []);

  // Save leads to localStorage whenever they change
  useEffect(() => {
    if (!loading && leads.length > 0) {
      localStorage.setItem('pipeline_leads', JSON.stringify(leads));
    }
  }, [leads, loading]);

  // Map old status to pipeline stage
  const mapStatusToStage = (status: string | null): string => {
    const statusMap: Record<string, string> = {
      'New': 'new',
      'Contacted': 'contacted',
      'Qualified': 'qualified',
      'Active': 'showing',
      'Under Contract': 'under_contract',
      'Closed': 'closed_won',
      'Cold': 'new',
    };
    return statusMap[status || ''] || 'new';
  };

  // Calculate priority from lead data
  const getPriorityFromScore = (lead: any): 'hot' | 'warm' | 'cold' => {
    let score = 30;
    if (lead.email) score += 10;
    if (lead.phone) score += 15;
    if (lead.price_range_max) score += 10;
    if (lead.status === 'Qualified') score += 20;
    if (score >= 70) return 'hot';
    if (score >= 50) return 'warm';
    return 'cold';
  };

  // Calculate days in current stage
  const getDaysInStage = (lead: PipelineLead): number => {
    const entered = new Date(lead.stage_entered_at);
    const now = new Date();
    return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Drag handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
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

    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId && lead.stage !== newStage) {
        return {
          ...lead,
          stage: newStage,
          stage_entered_at: new Date().toISOString(),
        };
      }
      return lead;
    }));
  };

  // Calculate stats
  const totalLeads = leads.length;
  const pipelineValue = leads
    .filter(l => l.stage !== 'closed_won')
    .reduce((sum, l) => sum + (l.deal_value || 0), 0);
  const closedWon = leads.filter(l => l.stage === 'closed_won').length;
  const closedValue = leads
    .filter(l => l.stage === 'closed_won')
    .reduce((sum, l) => sum + (l.deal_value || 0), 0);

  // Format currency
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  // Get leads for a stage
  const getLeadsForStage = (stageId: string) => {
    return leads.filter(l => l.stage === stageId);
  };

  // Get stage value
  const getStageValue = (stageId: string) => {
    return leads.filter(l => l.stage === stageId).reduce((sum, l) => sum + (l.deal_value || 0), 0);
  };

  // Open edit modal
  const openEditModal = (lead: PipelineLead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      stage: lead.stage,
      deal_value: lead.deal_value?.toString() || '',
      property_address: lead.property_address || '',
      lead_type: lead.lead_type,
      priority: lead.priority,
    });
    setShowModal(true);
  };

  // Open add modal
  const openAddModal = () => {
    setEditingLead(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      stage: 'new',
      deal_value: '',
      property_address: '',
      lead_type: 'buyer',
      priority: 'warm',
    });
    setShowModal(true);
  };

  // Save lead
  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingLead) {
      // Update existing
      setLeads(prev => prev.map(lead => {
        if (lead.id === editingLead.id) {
          const stageChanged = lead.stage !== formData.stage;
          return {
            ...lead,
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            stage: formData.stage,
            deal_value: formData.deal_value ? parseFloat(formData.deal_value) : null,
            property_address: formData.property_address || null,
            lead_type: formData.lead_type,
            priority: formData.priority,
            stage_entered_at: stageChanged ? new Date().toISOString() : lead.stage_entered_at,
          };
        }
        return lead;
      }));
    } else {
      // Add new
      const newLead: PipelineLead = {
        id: `pl_${Date.now()}`,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        stage: formData.stage,
        deal_value: formData.deal_value ? parseFloat(formData.deal_value) : null,
        property_address: formData.property_address || null,
        lead_type: formData.lead_type,
        priority: formData.priority,
        stage_entered_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setLeads(prev => [...prev, newLead]);
    }

    setShowModal(false);
  };

  // Delete lead
  const handleDelete = () => {
    if (editingLead && confirm('Delete this lead from the pipeline?')) {
      setLeads(prev => prev.filter(l => l.id !== editingLead.id));
      setShowModal(false);
    }
  };

  // Priority colors
  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'hot': return 'border-l-red-500';
      case 'warm': return 'border-l-yellow-500';
      default: return 'border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-white">🔀 Pipeline</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700/50">
          <p className="text-sm text-gray-400">Total Leads</p>
          <p className="text-3xl font-bold text-purple-400">{totalLeads}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700/50">
          <p className="text-sm text-gray-400">Pipeline Value</p>
          <p className="text-3xl font-bold text-amber-400">{formatCurrency(pipelineValue)}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700/50">
          <p className="text-sm text-gray-400">Closed Won</p>
          <p className="text-3xl font-bold text-green-400">{closedWon}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700/50">
          <p className="text-sm text-gray-400">Closed Value</p>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(closedValue)}</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => {
            const stageLeads = getLeadsForStage(stage.id);
            const stageValue = getStageValue(stage.id);
            const isDropTarget = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`w-72 flex-shrink-0 bg-gray-800/30 backdrop-blur rounded-xl border-t-4 ${stage.color} 
                  ${isDropTarget ? `border-2 border-dashed border-white/50 ${stage.bgHover}` : 'border border-gray-700/50'}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm">{stage.name}</h3>
                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                      {stageLeads.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-green-400 mt-1">{formatCurrency(stageValue)}</p>
                  )}
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
                  {stageLeads.map(lead => {
                    const daysInStage = getDaysInStage(lead);
                    const isStale = daysInStage > 7;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => openEditModal(lead)}
                        className={`bg-gray-900/80 backdrop-blur rounded-lg p-3 border-l-4 ${getPriorityBorder(lead.priority)} 
                          border border-gray-700/50 cursor-grab active:cursor-grabbing
                          hover:bg-gray-800/80 hover:border-gray-600/50 transition-all`}
                      >
                        {/* Lead Name */}
                        <p className="font-medium text-white text-sm truncate">{lead.name}</p>

                        {/* Property Address */}
                        {lead.property_address && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" />
                            <span className="truncate">{lead.property_address}</span>
                          </p>
                        )}

                        {/* Deal Value & Type */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {lead.deal_value && (
                              <span className="text-green-400 text-xs font-medium">
                                {formatCurrency(lead.deal_value)}
                              </span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase
                              ${lead.lead_type === 'buyer' ? 'bg-blue-500/20 text-blue-400' : 
                                lead.lead_type === 'seller' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-gray-500/20 text-gray-400'}`}>
                              {lead.lead_type}
                            </span>
                          </div>
                          <span className={`text-xs ${isStale ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                            {daysInStage}d
                          </span>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-700/50">
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                            >
                              <PhoneIcon className="w-3 h-3" /> Call
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                            >
                              <EnvelopeIcon className="w-3 h-3" /> Email
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="text-center text-gray-500 text-xs py-8">
                      Drag leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={openAddModal}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 
          rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center
          transition-all hover:scale-110 z-50"
      >
        <PlusIcon className="w-6 h-6 text-white" />
      </button>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700/50 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
              <h2 className="text-lg font-semibold text-white">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 
                    text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  placeholder="John Smith"
                />
              </div>

              {/* Contact Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 
                      text-white focus:border-purple-500 outline-none text-sm"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 
                      text-white focus:border-purple-500 outline-none text-sm"
                    placeholder="john@email.com"
                  />
                </div>
              </div>

              {/* Stage Dropdown */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData(f => ({ ...f, stage: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 
                    text-white focus:border-purple-500 outline-none"
                >
                  {STAGES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Deal Value */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Deal Value ($)</label>
                <input
                  type="number"
                  value={formData.deal_value}
                  onChange={(e) => setFormData(f => ({ ...f, deal_value: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 
                    text-white focus:border-purple-500 outline-none"
                  placeholder="350000"
                />
              </div>

              {/* Property Address */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Property Address</label>
                <input
                  type="text"
                  value={formData.property_address}
                  onChange={(e) => setFormData(f => ({ ...f, property_address: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 
                    text-white focus:border-purple-500 outline-none"
                  placeholder="123 Main St, Austin, TX"
                />
              </div>

              {/* Type & Priority Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select
                    value={formData.lead_type}
                    onChange={(e) => setFormData(f => ({ ...f, lead_type: e.target.value as any }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 
                      text-white focus:border-purple-500 outline-none"
                  >
                    <option value="buyer">🏠 Buyer</option>
                    <option value="seller">🏷️ Seller</option>
                    <option value="both">↔️ Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(f => ({ ...f, priority: e.target.value as any }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 
                      text-white focus:border-purple-500 outline-none"
                  >
                    <option value="hot">🔥 Hot</option>
                    <option value="warm">🟡 Warm</option>
                    <option value="cold">🔵 Cold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-700/50">
              <div>
                {editingLead && (
                  <button
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg 
                    text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
