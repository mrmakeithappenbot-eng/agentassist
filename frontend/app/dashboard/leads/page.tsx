'use client';

import { useState, useEffect } from 'react';
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  tags: string[];
  location: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/leads?limit=100`);
        const data = await response.json();
        
        if (data.success) {
          setLeads(data.leads);
        } else {
          setError('Failed to load leads');
        }
      } catch (err) {
        setError('Error connecting to backend');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your leads from BoldTrail...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Leads
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {leads.length} leads from BoldTrail
        </p>
      </div>

      {/* Leads Grid */}
      {leads.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No leads found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your BoldTrail leads will appear here once they sync.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Lead Name */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {lead.first_name} {lead.last_name}
                  </h3>
                  {lead.status && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {lead.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {lead.email && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.location && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    <span>{lead.location}</span>
                  </div>
                )}
              </div>

              {/* Price Range */}
              {(lead.price_range_min || lead.price_range_max) && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Budget: ${lead.price_range_min?.toLocaleString() || '?'} - ${lead.price_range_max?.toLocaleString() || '?'}
                  </p>
                </div>
              )}

              {/* Tags */}
              {lead.tags && lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
