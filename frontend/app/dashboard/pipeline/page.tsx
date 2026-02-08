'use client';

import { useState, useEffect, DragEvent } from 'react';
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

// Pipeline stages - clean, no emojis
const STAGES = [
  { id: 'new', name: 'New', accent: 'bg-gray-400' },
  { id: 'contacted', name: 'Contacted', accent: 'bg-blue-400' },
  { id: 'qualified', name: 'Qualified', accent: 'bg-indigo-400' },
  { id: 'showing', name: 'Showing', accent: 'bg-violet-400' },
  { id: 'under_contract', name: 'Under Contract', accent: 'bg-purple-400' },
  { id: 'closing', name: 'Closing', accent: 'bg-fuchsia-400' },
  { id: 'closed_won', name: 'Closed', accent: 'bg-emerald-400' },
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
  stage_entered_at: string;
  created_at: string;
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const stored = localStorage.getItem('pipeline_leads');
        if (stored) {
          setLeads(JSON.parse(stored));
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/leads?limit=100`);
        const data = await response.json();

        if (data.success && data.leads) {
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

  useEffect(() => {
    if (!loading && leads.length > 0) {
      localStorage.setItem('pipeline_leads', JSON.stringify(leads));
    }
  }, [leads, loading]);

  const mapStatusToStage = (status: string | null): string => {
    const statusMap: Record<string, string> = {
      'New': 'new', 'Contacted': 'contacted', 'Qualified': 'qualified',
      'Active': 'showing', 'Under Contract': 'under_contract',
      'Closed': 'closed_won', 'Cold': 'new',
    };
    return statusMap[status || ''] || 'new';
  };

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

  const getDaysInStage = (lead: PipelineLead): number => {
    const entered = new Date(lead.stage_entered_at);
    const now = new Date();
    return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
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

    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId && lead.stage !== newStage) {
        return { ...lead, stage: newStage, stage_entered_at: new Date().toISOString() };
      }
      return lead;
    }));
  };

  // Stats
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

  const openAddModal = () => {
    setEditingLead(null);
    setFormData({
      name: '', email: '', phone: '', stage: 'new', deal_value: '',
      property_address: '', lead_type: 'buyer', priority: 'warm',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingLead) {
      setLeads(prev => prev.map(lead => {
        if (lead.id === editingLead.id) {
          const stageChanged = lead.stage !== formData.stage;
          return {
            ...lead, name: formData.name, email: formData.email || null,
            phone: formData.phone || null, stage: formData.stage,
            deal_value: formData.deal_value ? parseFloat(formData.deal_value) : null,
            property_address: formData.property_address || null,
            lead_type: formData.lead_type, priority: formData.priority,
            stage_entered_at: stageChanged ? new Date().toISOString() : lead.stage_entered_at,
          };
        }
        return lead;
      }));
    } else {
      const newLead: PipelineLead = {
        id: `pl_${Date.now()}`, name: formData.name, email: formData.email || null,
        phone: formData.phone || null, stage: formData.stage,
        deal_value: formData.deal_value ? parseFloat(formData.deal_value) : null,
        property_address: formData.property_address || null,
        lead_type: formData.lead_type, priority: formData.priority,
        stage_entered_at: new Date().toISOString(), created_at: new Date().toISOString(),
      };
      setLeads(prev => [...prev, newLead]);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (editingLead && confirm('Remove this lead from the pipeline?')) {
      setLeads(prev => prev.filter(l => l.id !== editingLead.id));
      setShowModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Pipeline</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track deals from lead to close</p>
        </div>
      </div>

      {/* Stats - Apple-style cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: totalLeads, color: 'text-white' },
          { label: 'Pipeline Value', value: formatCurrency(pipelineValue), color: 'text-white' },
          { label: 'Closed Won', value: closedWon, color: 'text-emerald-400' },
          { label: 'Closed Value', value: formatCurrency(closedValue), color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-4 px-4 pb-4">
        <div className="flex gap-3 min-w-max">
          {STAGES.map(stage => {
            const stageLeads = getLeadsForStage(stage.id);
            const stageValue = getStageValue(stage.id);
            const isDropTarget = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`w-64 flex-shrink-0 rounded-2xl transition-all duration-200
                  ${isDropTarget 
                    ? 'bg-white/10 ring-2 ring-white/20' 
                    : 'bg-white/[0.03]'}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stage.accent}`} />
                    <h3 className="text-sm font-medium text-gray-300">{stage.name}</h3>
                    <span className="text-xs text-gray-500 ml-auto">{stageLeads.length}</span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-gray-500 mt-1 ml-4">{formatCurrency(stageValue)}</p>
                  )}
                </div>

                {/* Cards */}
                <div className="px-2 pb-2 space-y-2 min-h-[120px] max-h-[60vh] overflow-y-auto">
                  {stageLeads.map(lead => {
                    const daysInStage = getDaysInStage(lead);
                    const isStale = daysInStage > 7;
                    const isDragging = draggingId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openEditModal(lead)}
                        className={`bg-gray-900/80 backdrop-blur-sm rounded-xl p-3.5 
                          cursor-grab active:cursor-grabbing
                          border border-white/[0.06] hover:border-white/10
                          shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30
                          transition-all duration-200 hover:-translate-y-0.5
                          ${isDragging ? 'opacity-50 scale-95' : ''}`}
                      >
                        {/* Priority indicator - subtle dot */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5
                              ${lead.priority === 'hot' ? 'bg-red-400' : 
                                lead.priority === 'warm' ? 'bg-amber-400' : 'bg-gray-500'}`} 
                            />
                            <p className="font-medium text-white text-sm truncate">{lead.name}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0
                            ${lead.lead_type === 'buyer' 
                              ? 'bg-blue-500/15 text-blue-400' 
                              : lead.lead_type === 'seller'
                              ? 'bg-purple-500/15 text-purple-400'
                              : 'bg-gray-500/15 text-gray-400'}`}>
                            {lead.lead_type === 'buyer' ? 'Buy' : lead.lead_type === 'seller' ? 'Sell' : 'Both'}
                          </span>
                        </div>

                        {/* Property Address */}
                        {lead.property_address && (
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5 truncate">
                            <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                            {lead.property_address}
                          </p>
                        )}

                        {/* Bottom row */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
                          <div className="flex items-center gap-3">
                            {lead.deal_value && (
                              <span className="text-xs font-medium text-emerald-400">
                                {formatCurrency(lead.deal_value)}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              {lead.phone && (
                                <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded-md hover:bg-white/10 transition-colors">
                                  <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                                </a>
                              )}
                              {lead.email && (
                                <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded-md hover:bg-white/10 transition-colors">
                                  <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" />
                                </a>
                              )}
                            </div>
                          </div>
                          <span className={`text-[10px] ${isStale ? 'text-red-400' : 'text-gray-600'}`}>
                            {daysInStage}d
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-gray-600 text-xs">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Add Button - Apple style */}
      <button
        onClick={openAddModal}
        className="fixed bottom-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/15 
          backdrop-blur-xl rounded-full shadow-2xl shadow-black/50
          flex items-center justify-center transition-all duration-200
          hover:scale-105 active:scale-95 border border-white/10"
      >
        <PlusIcon className="w-5 h-5 text-white" />
      </button>

      {/* Modal - Apple style */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-gray-900/95 backdrop-blur-xl rounded-2xl w-full max-w-md 
              border border-white/10 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-base font-semibold text-white">
                {editingLead ? 'Edit Lead' : 'New Lead'}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 
                    text-white text-sm placeholder-gray-500
                    focus:border-white/20 focus:bg-white/10 focus:outline-none transition-all"
                  placeholder="John Smith"
                  autoFocus
                />
              </div>

              {/* Contact Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 
                      text-white text-sm placeholder-gray-500
                      focus:border-white/20 focus:bg-white/10 focus:outline-none transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 
                      text-white text-sm placeholder-gray-500
                      focus:border-white/20 focus:bg-white/10 focus:outline-none transition-all"
                    placeholder="john@email.com"
                  />
                </div>
              </div>

              {/* Stage */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData(f => ({ ...f, stage: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 
                    text-white text-sm focus:border-white/20 focus:bg-white/10 focus:outline-none 
                    transition-all appearance-none cursor-pointer"
                >
                  {STAGES.map(s => (
                    <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Deal Value */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Deal Value</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    value={formData.deal_value}
                    onChange={(e) => setFormData(f => ({ ...f, deal_value: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 
                      text-white text-sm placeholder-gray-500
                      focus:border-white/20 focus:bg-white/10 focus:outline-none transition-all"
                    placeholder="350,000"
                  />
                </div>
              </div>

              {/* Property Address */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Property Address</label>
                <input
                  type="text"
                  value={formData.property_address}
                  onChange={(e) => setFormData(f => ({ ...f, property_address: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 
                    text-white text-sm placeholder-gray-500
                    focus:border-white/20 focus:bg-white/10 focus:outline-none transition-all"
                  placeholder="123 Main St, Austin, TX"
                />
              </div>

              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Type</label>
                  <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                    {(['buyer', 'seller', 'both'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData(f => ({ ...f, lead_type: type }))}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all
                          ${formData.lead_type === type 
                            ? 'bg-white/15 text-white' 
                            : 'text-gray-400 hover:text-gray-300'}`}
                      >
                        {type === 'buyer' ? 'Buyer' : type === 'seller' ? 'Seller' : 'Both'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Priority</label>
                  <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                    {(['hot', 'warm', 'cold'] as const).map(priority => (
                      <button
                        key={priority}
                        onClick={() => setFormData(f => ({ ...f, priority }))}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all
                          ${formData.priority === priority 
                            ? 'bg-white/15 text-white' 
                            : 'text-gray-400 hover:text-gray-300'}`}
                      >
                        {priority === 'hot' ? 'Hot' : priority === 'warm' ? 'Warm' : 'Cold'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
              <div>
                {editingLead && (
                  <button onClick={handleDelete}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors">
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="px-5 py-2 bg-white text-gray-900 rounded-xl text-sm font-medium
                    hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  {editingLead ? 'Save' : 'Add Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
