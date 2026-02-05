'use client';

import { useState } from 'react';
import { 
  CheckCircleIcon, 
  XMarkIcon, 
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

// Mock pending messages
const MOCK_MESSAGES = [
  {
    id: 1,
    leadName: 'John Smith',
    leadEmail: 'john.smith@email.com',
    leadPhone: '(512) 555-0123',
    messageType: 'email',
    subject: 'Follow-up: Your Austin Home Search',
    body: 'Hi John,\n\nI saw you recently inquired about properties in the 78701 area. I wanted to reach out and see if you\'d like to schedule a showing this week.\n\nI have 3 listings that match your criteria:\n• 3BR/2BA at $450K - Modern downtown condo\n• 4BR/3BA at $625K - Family home in Hyde Park\n• 2BR/2BA at $380K - Renovated bungalow\n\nWould Tuesday or Thursday work for you?\n\nBest regards,\nYour Agent',
    generatedAt: '2024-02-04 18:45:00',
    leadContext: {
      priceRange: '$400K-$650K',
      location: 'Austin, TX 78701',
      lastActivity: '3 hours ago',
      status: 'New Lead'
    }
  },
  {
    id: 2,
    leadName: 'Sarah Johnson',
    leadEmail: 'sarah.j@email.com',
    leadPhone: '(512) 555-0456',
    messageType: 'sms',
    subject: null,
    body: 'Hi Sarah! Just checking in on your interest in the Round Rock property we discussed. The sellers are motivated and open to offers. Are you available for a quick call this week?',
    generatedAt: '2024-02-04 17:30:00',
    leadContext: {
      priceRange: '$350K-$450K',
      location: 'Round Rock, TX',
      lastActivity: '1 day ago',
      status: 'Attempted Contact'
    }
  },
  {
    id: 3,
    leadName: 'Michael Chen',
    leadEmail: 'mchen@email.com',
    leadPhone: '(512) 555-0789',
    messageType: 'email',
    subject: 'Investment Properties - North Austin',
    body: 'Hi Michael,\n\nFollowing up on your interest in investment properties in North Austin.\n\nI just got word of a new listing that hasn\'t hit the market yet:\n• 4-plex on Burnet Road\n• $850K asking price\n• Current cap rate: 6.5%\n• All units rented, solid tenants\n\nWould you like the full details? This won\'t last long.\n\nLet me know,\nYour Agent',
    generatedAt: '2024-02-04 16:15:00',
    leadContext: {
      priceRange: '$750K-$1M',
      location: 'North Austin',
      lastActivity: '2 days ago',
      status: 'Qualified'
    }
  }
];

export default function MessagesPage() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  
  const handleApprove = (id: number) => {
    const message = messages.find(m => m.id === id);
    if (message) {
      alert(`✅ Message approved and sent to ${message.leadName}!`);
      setMessages(messages.filter(m => m.id !== id));
    }
  };
  
  const handleReject = (id: number) => {
    const message = messages.find(m => m.id === id);
    if (confirm(`Reject message to ${message?.leadName}?`)) {
      setMessages(messages.filter(m => m.id !== id));
    }
  };
  
  const handleEdit = (message: any) => {
    setEditingId(message.id);
    setEditedBody(message.body);
    setEditedSubject(message.subject || '');
  };
  
  const handleSaveEdit = (id: number) => {
    setMessages(messages.map(m => 
      m.id === id 
        ? { ...m, body: editedBody, subject: editedSubject || m.subject }
        : m
    ));
    setEditingId(null);
    alert('✅ Changes saved! Click Approve to send.');
  };
  
  return (
    <div className="p-6 md:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Pending Approvals
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and approve AI-generated follow-up messages
            </p>
          </div>
          <div className="bg-warning-100 dark:bg-warning-900/30 px-4 py-2 rounded-lg">
            <span className="text-2xl font-bold text-warning-700 dark:text-warning-300">
              {messages.length}
            </span>
            <span className="text-sm text-warning-600 dark:text-warning-400 ml-2">
              pending
            </span>
          </div>
        </div>
      </div>
      
      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            All Caught Up!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No messages waiting for approval. Your AI is working in the background.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((message) => (
            <div 
              key={message.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-warning-200 dark:border-warning-800 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-warning-50 dark:bg-warning-900/20 px-6 py-4 border-b border-warning-200 dark:border-warning-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {message.leadName}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        message.messageType === 'email' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {message.messageType === 'email' ? '📧 Email' : '💬 SMS'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <EnvelopeIcon className="w-4 h-4 mr-1" />
                        {message.leadEmail}
                      </span>
                      <span className="flex items-center">
                        <PhoneIcon className="w-4 h-4 mr-1" />
                        {message.leadPhone}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Generated {message.generatedAt}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Lead Context */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">Status:</strong> {message.leadContext.status}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">Price:</strong> {message.leadContext.priceRange}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">Area:</strong> {message.leadContext.location}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">Last Activity:</strong> {message.leadContext.lastActivity}
                  </span>
                </div>
              </div>
              
              {/* Message Content */}
              <div className="p-6">
                {editingId === message.id ? (
                  <div className="space-y-4">
                    {message.messageType === 'email' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Message
                      </label>
                      <textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        rows={message.messageType === 'email' ? 12 : 4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSaveEdit(message.id)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {message.subject && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Subject:
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {message.subject}
                        </p>
                      </div>
                    )}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200">
                        {message.body}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              {editingId !== message.id && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                  <button
                    onClick={() => handleApprove(message.id)}
                    className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Approve & Send
                  </button>
                  <button
                    onClick={() => handleEdit(message)}
                    className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <PencilIcon className="w-5 h-5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleReject(message.id)}
                    className="flex-1 md:flex-none px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
