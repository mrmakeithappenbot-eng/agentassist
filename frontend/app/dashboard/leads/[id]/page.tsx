'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  TagIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  PhoneArrowUpRightIcon,
  CalendarIcon,
  HomeIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
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
  address: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  notes: string | null;
  created_at: string | null;
}

interface Activity {
  id: number;
  lead_id: number;
  activity_type: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

const ACTIVITY_TYPES = [
  { value: 'note', label: 'Note', icon: DocumentTextIcon },
  { value: 'call', label: 'Phone Call', icon: PhoneArrowUpRightIcon },
  { value: 'email', label: 'Email', icon: EnvelopeIcon },
  { value: 'showing', label: 'Showing', icon: HomeIcon },
  { value: 'meeting', label: 'Meeting', icon: CalendarIcon },
  { value: 'other', label: 'Other', icon: ChatBubbleLeftIcon }
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activity_type: 'note',
    title: '',
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchLead = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/leads/${leadId}`);
      const data = await response.json();
      
      if (data.success) {
        setLead(data.lead);
      }
    } catch (err) {
      console.error('Error fetching lead:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/leads/${leadId}/activities`);
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/leads/${leadId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityForm)
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setActivityForm({
          activity_type: 'note',
          title: '',
          content: ''
        });
        setShowActivityForm(false);
        
        // Refresh activities
        await fetchActivities();
      } else {
        alert('Failed to add activity: ' + (data.error || data.detail));
      }
    } catch (err) {
      console.error(err);
      alert('Error adding activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm('Delete this activity?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/leads/${leadId}/activities/${activityId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchActivities();
      } else {
        alert('Failed to delete activity');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting activity');
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLead();
      fetchActivities();
    }
  }, [leadId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type);
    return activityType?.icon || ChatBubbleLeftIcon;
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-800 dark:text-red-200">Lead not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/dashboard/leads')}
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back to Leads
      </button>

      {/* Lead Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {lead.first_name} {lead.last_name}
              </h1>
              {lead.status && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                  {lead.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {lead.email && (
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-400" />
              <a href={`mailto:${lead.email}`} className="hover:text-primary-600">
                {lead.email}
              </a>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <PhoneIcon className="w-5 h-5 mr-3 text-gray-400" />
              <a href={`tel:${lead.phone}`} className="hover:text-primary-600">
                {lead.phone}
              </a>
            </div>
          )}
          {lead.location && (
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <MapPinIcon className="w-5 h-5 mr-3 text-gray-400" />
              {lead.location}
            </div>
          )}
          {(lead.price_range_min || lead.price_range_max) && (
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <span className="mr-2">💰</span>
              ${lead.price_range_min?.toLocaleString() || '?'} - ${lead.price_range_max?.toLocaleString() || '?'}
            </div>
          )}
        </div>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {lead.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <TagIcon className="w-4 h-4 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Property Address */}
        {lead.address && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start">
              <MapPinIcon className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Property Address</p>
                <p className="text-blue-700 dark:text-blue-300">{lead.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {lead.notes && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start">
              <DocumentTextIcon className="w-5 h-5 mr-3 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Notes</p>
                <p className="text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Activity Timeline
          </h2>
          <button
            onClick={() => setShowActivityForm(!showActivityForm)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Activity
          </button>
        </div>

        {/* Add Activity Form */}
        {showActivityForm && (
          <form onSubmit={handleAddActivity} className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity Type
                </label>
                <select
                  value={activityForm.activity_type}
                  onChange={(e) => setActivityForm({...activityForm, activity_type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {ACTIVITY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({...activityForm, title: e.target.value})}
                  placeholder="Quick summary..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Details *
              </label>
              <textarea
                value={activityForm.content}
                onChange={(e) => setActivityForm({...activityForm, content: e.target.value})}
                rows={3}
                required
                placeholder="What happened?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowActivityForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Activity'}
              </button>
            </div>
          </form>
        )}

        {/* Timeline */}
        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No activities yet. Add your first interaction above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type);
              return (
                <div
                  key={activity.id}
                  className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">
                          {ACTIVITY_TYPES.find(t => t.value === activity.activity_type)?.label || activity.activity_type}
                        </span>
                        {activity.title && (
                          <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                            {activity.title}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete activity"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap">
                      {activity.content}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {formatDate(activity.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
