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

const STAGES = [
  { id: 'new', name: 'New', color: '#6b7280' },
  { id: 'contacted', name: 'Contacted', color: '#3b82f6' },
  { id: 'qualified', name: 'Qualified', color: '#6366f1' },
  { id: 'showing', name: 'Showing', color: '#8b5cf6' },
  { id: 'under_contract', name: 'Under Contract', color: '#a855f7' },
  { id: 'closing', name: 'Closing', color: '#d946ef' },
  { id: 'closed_won', name: 'Closed', color: '#10b981' },
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
        <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-sm text-gray-400">Track deals from lead to close</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 font-medium">Total Leads</p>
          <p className="text-3xl font-bold text-white mt-1">{totalLeads}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 font-medium">Pipeline Value</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{formatCurrency(pipelineValue)}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 font-medium">Closed Won</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{closedWon}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-xs text-gray-400 font-medium">Closed Value</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{formatCurrency(closedValue)}</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto -mx-4 px-4 pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => {
            const stageLeads = getLeadsForStage(stage.id);
            const stageValue = getStageValue(stage.id);
            const isDropTarget = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`w-72 flex-shrink-0 rounded-xl transition-all duration-150
                  ${isDropTarget 
                    ? 'bg-gray-700 ring-2 ring-blue-500' 
                    : 'bg-gray-800/50'}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div 
                  className="px-4 py-3 border-b border-gray-700 rounded-t-xl"
                  style={{ borderTop: `3px solid ${stage.color}` }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{stage.name}</h3>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full font-medium">
                      {stageLeads.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-emerald-400 mt-1 font-medium">{formatCurrency(stageValue)}</p>
                  )}
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 min-h-[150px] max-h-[55vh] overflow-y-auto">
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
                        className={`bg-gray-900 rounded-lg p-4 cursor-grab active:cursor-grabbing
                          border border-gray-700 hover:border-gray-600
                          transition-all duration-150 hover:bg-gray-850
                          ${isDragging ? 'opacity-40 scale-95' : 'hover:-translate-y-0.5 hover:shadow-lg'}`}
                      >
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Priority Dot */}
                            <div className={`w-2 h-2 rounded-full flex-shrink-0
                              ${lead.priority === 'hot' ? 'bg-red-500' : 
                                lead.priority === 'warm' ? 'bg-yellow-500' : 'bg-gray-500'}`} 
                            />
                            <p className="font-semibold text-white text-sm truncate">{lead.name}</p>
                          </div>
                          {/* Type Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 uppercase
                            ${lead.lead_type === 'buyer' 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : lead.lead_type === 'seller'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                            {lead.lead_type === 'buyer' ? 'Buy' : lead.lead_type === 'seller' ? 'Sell' : 'Both'}
                          </span>
                        </div>

                        {/* Property Address */}
                        {lead.property_address && (
                          <div className="flex items-center gap-1.5 text-gray-400 mb-3">
                            <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            <p className="text-xs truncate">{lead.property_address}</p>
                          </div>
                        )}

                        {/* Footer Row */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                          <div className="flex items-center gap-3">
                            {lead.deal_value ? (
                              <span className="text-sm font-bold text-emerald-400">
                                {formatCurrency(lead.deal_value)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">No value</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Quick Actions */}
                            {lead.phone && (
                              <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors">
                                <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                              </a>
                            )}
                            {lead.email && (
                              <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors">
                                <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" />
                              </a>
                            )}
                            {/* Days Badge */}
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded
                              ${isStale 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-gray-800 text-gray-500'}`}>
                              {daysInStage}d
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                      <p className="text-sm">Drop leads here</p>
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 
          rounded-full shadow-lg shadow-blue-600/30
          flex items-center justify-center transition-all duration-150
          hover:scale-105 active:scale-95"
      >
        <PlusIcon className="w-6 h-6 text-white" />
      </button>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">
                {editingLead ? 'Edit Lead' : 'New Lead'}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 
                    text-white placeholder-gray-500
                    focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="John Smith"
                  autoFocus
                />
              </div>

              {/* Contact Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 
                      text-white placeholder-gray-500
                      focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 
                      text-white placeholder-gray-500
                      focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="john@email.com"
                  />
                </div>
              </div>

              {/* Stage */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData(f => ({ ...f, stage: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 
                    text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {STAGES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Deal Value */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Deal Value</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={formData.deal_value}
                    onChange={(e) => setFormData(f => ({ ...f, deal_value: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-8 pr-4 py-2.5 
                      text-white placeholder-gray-500
                      focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="350,000"
                  />
                </div>
              </div>

              {/* Property Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Property Address</label>
                <input
                  type="text"
                  value={formData.property_address}
                  onChange={(e) => setFormData(f => ({ ...f, property_address: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 
                    text-white placeholder-gray-500
                    focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="123 Main St, Austin, TX"
                />
              </div>

              {/* Type & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
                  <select
                    value={formData.lead_type}
                    onChange={(e) => setFormData(f => ({ ...f, lead_type: e.target.value as any }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 
                      text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(f => ({ ...f, priority: e.target.value as any }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 
                      text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-700 bg-gray-800/50 rounded-b-xl">
              <div>
                {editingLead && (
                  <button onClick={handleDelete}
                    className="text-sm text-red-400 hover:text-red-300 font-medium">
                    Delete Lead
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white font-medium">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg 
                    text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  {editingLead ? 'Save Changes' : 'Add Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
