'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XMarkIcon, 
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  SparklesIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

interface PendingMessage {
  id: number;
  lead_id: string;
  lead_name: string;
  lead_email: string | null;
  lead_phone: string | null;
  message_type: 'email' | 'sms';
  subject: string | null;
  body: string;
  generated_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
}

const STORAGE_KEY = 'agentassist_pending_messages';

export default function MessagesPage() {
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<PendingMessage | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'sent' | 'all'>('pending');

  // Load messages from localStorage (in future: from API)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setMessages(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, loading]);

  const handleApprove = async (message: PendingMessage) => {
    // TODO: Integrate with real email/SMS sending API
    setMessages(prev => prev.map(m => 
      m.id === message.id ? { ...m, status: 'approved' as const } : m
    ));
    setSelectedMessage(null);
  };

  const handleReject = (id: number) => {
    setMessages(prev => prev.map(m => 
      m.id === id ? { ...m, status: 'rejected' as const } : m
    ));
    setSelectedMessage(null);
  };

  const handleSend = async (message: PendingMessage) => {
    // TODO: Integrate with real email/SMS sending API (SendGrid, Twilio)
    alert(`Sending ${message.message_type === 'email' ? 'email' : 'SMS'} to ${message.lead_name}...\n\nNote: Email/SMS integration coming soon. This will connect to SendGrid and Twilio.`);
    setMessages(prev => prev.map(m => 
      m.id === message.id ? { ...m, status: 'sent' as const } : m
    ));
  };

  const handleEdit = (message: PendingMessage) => {
    setSelectedMessage(message);
    setEditedBody(message.body);
  };

  const handleSaveEdit = () => {
    if (!selectedMessage) return;
    setMessages(prev => prev.map(m => 
      m.id === selectedMessage.id ? { ...m, body: editedBody } : m
    ));
    setSelectedMessage(null);
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const pendingCount = messages.filter(m => m.status === 'pending').length;

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
          {pendingCount > 0 && (
            <span className="bg-primary-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Review and send AI-generated follow-up messages
        </p>
      </div>

      {/* Info Banner */}
      <div className="glass dark:glass-dark rounded-2xl p-6 mb-8 border border-white/30 dark:border-white/10">
        <div className="flex items-start gap-4">
          <SparklesIcon className="w-8 h-8 text-primary-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Follow-ups</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              AgentAssist will automatically draft personalized follow-up messages for your leads based on their activity and preferences.
              You review and approve before anything gets sent.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span>Human approval required</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <PencilIcon className="w-4 h-4 text-blue-500" />
                <span>Edit before sending</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <PaperAirplaneIcon className="w-4 h-4 text-purple-500" />
                <span>Email & SMS support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'pending', label: 'Pending Review' },
          { id: 'approved', label: 'Approved' },
          { id: 'sent', label: 'Sent' },
          { id: 'all', label: 'All' },
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
          </button>
        ))}
      </div>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="glass dark:glass-dark rounded-2xl p-12 text-center border border-white/30 dark:border-white/10">
          <EnvelopeIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {filter === 'pending' ? 'No messages pending review' : 'No messages yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'pending' 
              ? 'AI-generated follow-ups will appear here for your approval.'
              : 'Messages you review will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map(message => (
            <div 
              key={message.id}
              className="glass dark:glass-dark rounded-xl p-5 border border-white/30 dark:border-white/10"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Message Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {message.message_type === 'email' ? (
                      <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                    ) : (
                      <PhoneIcon className="w-5 h-5 text-green-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {message.lead_name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                      ${message.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        message.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        message.status === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                    </span>
                  </div>
                  
                  {message.subject && (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject: {message.subject}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line line-clamp-3">
                    {message.body}
                  </p>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Generated {new Date(message.generated_at).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(message)}
                    className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg smooth-transition"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  
                  {message.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReject(message.id)}
                        className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg smooth-transition"
                        title="Reject"
                      >
                        <XMarkIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </button>
                      <button
                        onClick={() => handleApprove(message)}
                        className="p-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg smooth-transition"
                        title="Approve"
                      >
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </button>
                    </>
                  )}
                  
                  {message.status === 'approved' && (
                    <button
                      onClick={() => handleSend(message)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg smooth-transition flex items-center gap-2"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Send
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selectedMessage && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit Message to {selectedMessage.lead_name}
              </h2>
              <button onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 smooth-transition">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {selectedMessage.subject && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={selectedMessage.subject}
                    readOnly
                    className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                      text-gray-700 dark:text-gray-300"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={10}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 
                    text-gray-900 dark:text-white placeholder-gray-400
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
              <button onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium smooth-transition">
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
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
