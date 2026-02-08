'use client';

import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import BackButton from '@/components/ui/BackButton';

interface Vendor {
  id: number;
  name: string;
  company?: string;
  category: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  rating: number;
  lastUsed?: string;
  createdAt: string;
}

const CATEGORIES = [
  'Inspector',
  'Lender',
  'Photographer',
  'Stager',
  'Cleaner',
  'Contractor',
  'Appraiser',
  'Title Company',
  'Attorney',
  'Moving Company',
  'Landscaper',
  'Handyman',
  'Other'
];

const STORAGE_KEY = 'agentassist_vendors';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '',
    company: '',
    category: 'Inspector',
    phone: '',
    email: '',
    website: '',
    notes: '',
    rating: 5
  });

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setVendors(JSON.parse(saved));
    } else {
      // Default vendors
      setVendors([
        { id: 1, name: 'John Smith', company: 'Premier Inspections', category: 'Inspector', phone: '(555) 123-4567', email: 'john@premierinspect.com', rating: 5, notes: 'Very thorough, great reports', createdAt: new Date().toISOString() },
        { id: 2, name: 'Sarah Johnson', company: 'First National Mortgage', category: 'Lender', phone: '(555) 234-5678', email: 'sarah@fnm.com', rating: 5, notes: 'Fast pre-approvals, great rates', createdAt: new Date().toISOString() },
        { id: 3, name: 'Mike Chen', company: 'Stellar Photography', category: 'Photographer', phone: '(555) 345-6789', email: 'mike@stellar.photo', website: 'stellarphotography.com', rating: 4, notes: 'Drone shots included', createdAt: new Date().toISOString() },
      ]);
    }
    setDataLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!dataLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vendors));
  }, [vendors, dataLoaded]);

  // Filter vendors
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = search === '' || 
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.company?.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || v.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedVendors = filteredVendors.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, Vendor[]>);

  // Save vendor
  const saveVendor = () => {
    if (!form.name || !form.category) {
      alert('Name and category are required');
      return;
    }

    if (editingVendor) {
      setVendors(vendors.map(v => v.id === editingVendor.id ? {
        ...editingVendor,
        ...form,
        company: form.company || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        notes: form.notes || undefined,
      } : v));
    } else {
      const newVendor: Vendor = {
        id: Date.now(),
        ...form,
        company: form.company || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        notes: form.notes || undefined,
        createdAt: new Date().toISOString()
      };
      setVendors([newVendor, ...vendors]);
    }

    resetForm();
  };

  const resetForm = () => {
    setForm({ name: '', company: '', category: 'Inspector', phone: '', email: '', website: '', notes: '', rating: 5 });
    setEditingVendor(null);
    setShowModal(false);
  };

  const editVendor = (vendor: Vendor) => {
    setForm({
      name: vendor.name,
      company: vendor.company || '',
      category: vendor.category,
      phone: vendor.phone || '',
      email: vendor.email || '',
      website: vendor.website || '',
      notes: vendor.notes || '',
      rating: vendor.rating
    });
    setEditingVendor(vendor);
    setShowModal(true);
  };

  const deleteVendor = (id: number) => {
    if (confirm('Delete this vendor?')) {
      setVendors(vendors.filter(v => v.id !== id));
    }
  };

  // Share vendor info
  const shareVendor = (vendor: Vendor) => {
    const text = `${vendor.category} Recommendation:\n\n${vendor.name}${vendor.company ? ` - ${vendor.company}` : ''}\n${vendor.phone ? `📞 ${vendor.phone}\n` : ''}${vendor.email ? `✉️ ${vendor.email}\n` : ''}${vendor.website ? `🌐 ${vendor.website}\n` : ''}\n${'⭐'.repeat(vendor.rating)} (${vendor.rating}/5)${vendor.notes ? `\n\nNotes: ${vendor.notes}` : ''}`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(vendor.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render stars
  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onChange?.(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            disabled={!interactive}
          >
            {star <= rating ? (
              <StarSolidIcon className="w-5 h-5 text-yellow-500" />
            ) : (
              <StarIcon className="w-5 h-5 text-gray-300" />
            )}
          </button>
        ))}
      </div>
    );
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
            <UserGroupIcon className="w-8 h-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Vendor Directory
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Your trusted partners — inspectors, lenders, photographers & more
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Vendor
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Vendors by Category */}
      {Object.keys(groupedVendors).length === 0 ? (
        <div className="glass dark:glass-dark rounded-2xl p-12 text-center border border-white/30 dark:border-white/10">
          <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Vendors Found
          </h3>
          <p className="text-gray-500 mb-6">
            {search || filterCategory !== 'all' ? 'Try adjusting your search or filter' : 'Add your first vendor to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedVendors).map(([category, categoryVendors]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                {category}
                <span className="text-sm font-normal text-gray-500">({categoryVendors.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="glass dark:glass-dark rounded-xl p-5 border border-white/30 dark:border-white/10 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{vendor.name}</h3>
                        {vendor.company && (
                          <p className="text-sm text-gray-500">{vendor.company}</p>
                        )}
                      </div>
                      {renderStars(vendor.rating)}
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      {vendor.phone && (
                        <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600">
                          <PhoneIcon className="w-4 h-4" />
                          {vendor.phone}
                        </a>
                      )}
                      {vendor.email && (
                        <a href={`mailto:${vendor.email}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600">
                          <EnvelopeIcon className="w-4 h-4" />
                          {vendor.email}
                        </a>
                      )}
                      {vendor.website && (
                        <a href={`https://${vendor.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600">
                          <GlobeAltIcon className="w-4 h-4" />
                          {vendor.website}
                        </a>
                      )}
                    </div>

                    {vendor.notes && (
                      <p className="text-sm text-gray-500 italic mb-4">"{vendor.notes}"</p>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => shareVendor(vendor)}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                          copiedId === vendor.id 
                            ? 'bg-green-600 text-white' 
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        <ShareIcon className="w-4 h-4" />
                        {copiedId === vendor.id ? 'Copied!' : 'Share'}
                      </button>
                      <button
                        onClick={() => editVendor(vendor)}
                        className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVendor(vendor.id)}
                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    placeholder="John Smith"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                  <input
                    type="text"
                    placeholder="ABC Inspections"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                <input
                  type="text"
                  placeholder="example.com"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                {renderStars(form.rating, true, (r) => setForm({ ...form, rating: r }))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  placeholder="Great to work with, fast turnaround..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveVendor}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                {editingVendor ? 'Save Changes' : 'Add Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
