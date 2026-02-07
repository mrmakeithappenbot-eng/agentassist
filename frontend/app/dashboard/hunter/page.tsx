'use client';

import { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EnvelopeIcon,
  PhoneIcon,
  HomeIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

// Mock data for FSBO leads
const MOCK_HUNTER_LEADS = [
  {
    id: 1,
    address: '1234 Maple Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    price: 450000,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 2100,
    ownerName: 'Michael Johnson',
    ownerPhone: '(512) 555-0123',
    ownerEmail: 'mjohnson@email.com',
    source: 'Zillow FSBO',
    foundAt: '2024-02-04 08:15 AM',
    status: 'new',
    listingUrl: 'https://zillow.com/...',
  },
  {
    id: 2,
    address: '5678 Oak Avenue',
    city: 'Austin',
    state: 'TX',
    zip: '78704',
    price: 625000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2800,
    ownerName: 'Sarah Williams',
    ownerPhone: null,
    ownerEmail: null,
    source: 'Craigslist FSBO',
    foundAt: '2024-02-04 08:45 AM',
    status: 'enriching',
    listingUrl: 'https://craigslist.org/...',
  },
  {
    id: 3,
    address: '910 Pine Court',
    city: 'Round Rock',
    state: 'TX',
    zip: '78664',
    price: 385000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1850,
    ownerName: 'Robert Chen',
    ownerPhone: '(512) 555-0456',
    ownerEmail: 'rchen@email.com',
    source: 'Zillow FSBO',
    foundAt: '2024-02-04 09:20 AM',
    status: 'contacted',
    listingUrl: 'https://zillow.com/...',
  },
];

export default function HunterPage() {
  const [leads, setLeads] = useState(MOCK_HUNTER_LEADS);
  const [zipCodes, setZipCodes] = useState('78701, 78704');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  const handleScan = () => {
    setIsScanning(true);
    // Simulate scraping process
    setTimeout(() => {
      setIsScanning(false);
      alert('Scan complete! Found 3 new FSBO leads.');
    }, 3000);
  };
  
  const handleAddToCRM = (leadId: number) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      alert(`Adding "${lead.address}" to your CRM...`);
      // This would call the backend API
    }
  };
  
  const handleDraftMessage = (leadId: number) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
    }
  };
  
  const statusColors: Record<string, string> = {
    new: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    enriching: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };
  
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <BackButton />
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <MagnifyingGlassIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            The Hunter
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Automated FSBO & Expired Listing Discovery. Never run out of prospects.
        </p>
      </div>
      
      {/* Scan Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Scan Settings
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target ZIP Codes (comma-separated)
            </label>
            <input
              type="text"
              value={zipCodes}
              onChange={(e) => setZipCodes(e.target.value)}
              placeholder="78701, 78704, 78664"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              The Hunter scans Zillow FSBO, Craigslist, and County Clerk sites daily at 8:00 AM
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {isScanning ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scanning...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                  Scan Now
                </>
              )}
            </button>
            
            <div className="flex-1 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Next automatic scan: Tomorrow at 8:00 AM
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Found Today</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Enriching</p>
          <p className="text-2xl font-bold text-yellow-600">3</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ready to Contact</p>
          <p className="text-2xl font-bold text-green-600">9</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Contacted</p>
          <p className="text-2xl font-bold text-blue-600">47</p>
        </div>
      </div>
      
      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            New Prospects ({leads.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <HomeIcon className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {lead.address}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {lead.city}, {lead.state} {lead.zip}
                        </p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">
                          ${lead.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lead.ownerName || 'Enriching...'}
                      </p>
                      {lead.ownerPhone && (
                        <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                          <PhoneIcon className="w-4 h-4 mr-1" />
                          {lead.ownerPhone}
                        </p>
                      )}
                      {lead.ownerEmail && (
                        <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                          <EnvelopeIcon className="w-4 h-4 mr-1" />
                          {lead.ownerEmail}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <p>{lead.bedrooms} bd • {lead.bathrooms} ba</p>
                    <p>{lead.sqft.toLocaleString()} sqft</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 dark:text-white">{lead.source}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{lead.foundAt}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCRM(lead.id)}
                        className="px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 text-sm font-medium transition-colors flex items-center"
                        title="Add to CRM"
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add
                      </button>
                      <button
                        onClick={() => handleDraftMessage(lead.id)}
                        disabled={!lead.ownerPhone && !lead.ownerEmail}
                        className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
                        title="Draft Icebreaker"
                      >
                        <EnvelopeIcon className="w-4 h-4 mr-1" />
                        Draft
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* AI Icebreaker Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              AI-Generated Icebreaker
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              For: {selectedLead.address}, {selectedLead.city}
            </p>
            <textarea
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-4"
              defaultValue={`Hi ${selectedLead.ownerName ? selectedLead.ownerName.split(' ')[0] : 'there'}! I noticed you're selling ${selectedLead.address} yourself. I work with buyers in ${selectedLead.city} and wanted to reach out. Would you be open to a buyer's agent bringing a qualified client to view the property?`}
            />
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Message sent to approval queue!');
                  setSelectedLead(null);
                }}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Send to Approvals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
