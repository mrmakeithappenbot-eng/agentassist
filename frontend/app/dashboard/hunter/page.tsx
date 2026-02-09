'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EnvelopeIcon,
  PhoneIcon,
  HomeIcon,
  CalendarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

interface HunterLead {
  id: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  source: string;
  foundAt: string;
  status: 'new' | 'contacted' | 'enriching' | 'added';
  listingUrl: string;
}

const STORAGE_KEY = 'agentassist_hunter_leads';

export default function HunterPage() {
  const [leads, setLeads] = useState<HunterLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'added'>('all');

  // Load saved leads from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setLeads(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Save leads to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    }
  }, [leads, loading]);

  const handleSearch = async () => {
    if (!searchLocation.trim()) return;
    
    setIsSearching(true);
    // TODO: Integrate with real FSBO/Expired listing APIs
    // For now, show a message that search is coming soon
    setTimeout(() => {
      setIsSearching(false);
      alert('FSBO & Expired listing search coming soon! This will integrate with Zillow, Realtor.com, and MLS data feeds.');
    }, 1000);
  };

  const handleAddToLeads = async (lead: HunterLead) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://agentassist-1.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/leads/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: lead.ownerName?.split(' ')[0] || 'Unknown',
          last_name: lead.ownerName?.split(' ').slice(1).join(' ') || '',
          email: lead.ownerEmail,
          phone: lead.ownerPhone,
          location: `${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`,
          price_max: lead.price,
          status: 'New',
          tags: ['FSBO', lead.source],
          notes: `Found via Hunter - ${lead.source}\nListing: ${lead.listingUrl}`
        })
      });

      if (response.ok) {
        setLeads(prev => prev.map(l => 
          l.id === lead.id ? { ...l, status: 'added' as const } : l
        ));
      }
    } catch (error) {
      console.error('Failed to add lead:', error);
    }
  };

  const handleMarkContacted = (id: number) => {
    setLeads(prev => prev.map(l => 
      l.id === id ? { ...l, status: 'contacted' as const } : l
    ));
  };

  const handleDelete = (id: number) => {
    if (confirm('Remove this lead from Hunter?')) {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">The Hunter</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Find FSBO and expired listings in your area
        </p>
      </div>

      {/* Search Section */}
      <div className="glass dark:glass-dark rounded-2xl p-6 mb-8 border border-white/30 dark:border-white/10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Search for Leads</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter city, zip code, or neighborhood..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 
                text-gray-900 dark:text-white placeholder-gray-400
                focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchLocation.trim()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl 
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 smooth-transition"
          >
            {isSearching ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="w-5 h-5" />
            )}
            {isSearching ? 'Searching...' : 'Hunt'}
          </button>
        </div>
        
        {/* Coming Soon Notice */}
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Coming Soon</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Automated FSBO & expired listing search will integrate with MLS data feeds, Zillow, and public records.
                For now, you can manually add leads you find.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'All Leads' },
          { id: 'new', label: 'New' },
          { id: 'contacted', label: 'Contacted' },
          { id: 'added', label: 'Added to CRM' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium smooth-transition
              ${filter === tab.id 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-2 text-xs opacity-70">
                ({leads.filter(l => l.status === tab.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <div className="glass dark:glass-dark rounded-2xl p-12 text-center border border-white/30 dark:border-white/10">
          <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No leads yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Use the search above to find FSBO and expired listings, or manually add leads you discover.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map(lead => (
            <div 
              key={lead.id}
              className="glass dark:glass-dark rounded-xl p-5 border border-white/30 dark:border-white/10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Property Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <HomeIcon className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {lead.address}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                      ${lead.status === 'new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        lead.status === 'added' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {lead.status === 'added' ? 'In CRM' : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {lead.city}, {lead.state} {lead.zip}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(lead.price)}
                    </span>
                    <span>{lead.bedrooms} bed</span>
                    <span>{lead.bathrooms} bath</span>
                    <span>{lead.sqft.toLocaleString()} sqft</span>
                    <span className="text-primary-600 dark:text-primary-400">{lead.source}</span>
                  </div>
                  
                  {lead.ownerName && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      Owner: <span className="font-medium">{lead.ownerName}</span>
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {lead.ownerPhone && (
                    <a
                      href={`tel:${lead.ownerPhone}`}
                      className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg smooth-transition"
                      title="Call"
                    >
                      <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </a>
                  )}
                  {lead.ownerEmail && (
                    <a
                      href={`mailto:${lead.ownerEmail}`}
                      className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg smooth-transition"
                      title="Email"
                    >
                      <EnvelopeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </a>
                  )}
                  
                  {lead.status === 'new' && (
                    <button
                      onClick={() => handleMarkContacted(lead.id)}
                      className="px-3 py-2 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 
                        hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-lg smooth-transition"
                    >
                      Mark Contacted
                    </button>
                  )}
                  
                  {lead.status !== 'added' && (
                    <button
                      onClick={() => handleAddToLeads(lead)}
                      className="px-3 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg smooth-transition flex items-center gap-1"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add to CRM
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
