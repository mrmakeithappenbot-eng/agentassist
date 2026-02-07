'use client';

import { useState, useEffect } from 'react';
import {
  HomeModernIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  UserPlusIcon,
  CalendarIcon,
  MapPinIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

interface OpenHouseVisitor {
  id: number;
  name: string;
  email: string;
  phone: string;
  preApproved: boolean;
  workingWithAgent: boolean;
  agentName?: string;
  notes?: string;
  signedInAt: string;
}

interface OpenHouse {
  id: number;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  mlsNumber?: string;
  listPrice?: number;
  notes?: string;
  visitors: OpenHouseVisitor[];
  createdAt: string;
}

const STORAGE_KEY = 'agentassist_open_houses';

export default function OpenHousePage() {
  const [openHouses, setOpenHouses] = useState<OpenHouse[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState<OpenHouse | null>(null);
  const [showVisitorsModal, setShowVisitorsModal] = useState<OpenHouse | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [newOpenHouse, setNewOpenHouse] = useState({
    address: '',
    date: '',
    startTime: '13:00',
    endTime: '16:00',
    mlsNumber: '',
    listPrice: '',
    notes: ''
  });

  // Sign-in form state
  const [signInForm, setSignInForm] = useState({
    name: '',
    email: '',
    phone: '',
    preApproved: false,
    workingWithAgent: false,
    agentName: '',
    notes: ''
  });

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setOpenHouses(JSON.parse(saved));
    }
    setDataLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!dataLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(openHouses));
  }, [openHouses, dataLoaded]);

  // Create open house
  const createOpenHouse = () => {
    if (!newOpenHouse.address || !newOpenHouse.date) {
      alert('Please enter address and date');
      return;
    }

    const oh: OpenHouse = {
      id: Date.now(),
      address: newOpenHouse.address,
      date: newOpenHouse.date,
      startTime: newOpenHouse.startTime,
      endTime: newOpenHouse.endTime,
      mlsNumber: newOpenHouse.mlsNumber || undefined,
      listPrice: newOpenHouse.listPrice ? parseFloat(newOpenHouse.listPrice) : undefined,
      notes: newOpenHouse.notes || undefined,
      visitors: [],
      createdAt: new Date().toISOString()
    };

    setOpenHouses([oh, ...openHouses]);
    setNewOpenHouse({
      address: '',
      date: '',
      startTime: '13:00',
      endTime: '16:00',
      mlsNumber: '',
      listPrice: '',
      notes: ''
    });
    setShowCreateModal(false);
  };

  // Delete open house
  const deleteOpenHouse = (id: number) => {
    if (confirm('Delete this open house and all visitor data?')) {
      setOpenHouses(openHouses.filter(oh => oh.id !== id));
    }
  };

  // Add visitor sign-in
  const addVisitor = () => {
    if (!signInForm.name || !signInForm.email) {
      alert('Name and email are required');
      return;
    }

    if (!showSignInModal) return;

    const visitor: OpenHouseVisitor = {
      id: Date.now(),
      name: signInForm.name,
      email: signInForm.email,
      phone: signInForm.phone,
      preApproved: signInForm.preApproved,
      workingWithAgent: signInForm.workingWithAgent,
      agentName: signInForm.workingWithAgent ? signInForm.agentName : undefined,
      notes: signInForm.notes || undefined,
      signedInAt: new Date().toISOString()
    };

    setOpenHouses(openHouses.map(oh => 
      oh.id === showSignInModal.id 
        ? { ...oh, visitors: [...oh.visitors, visitor] }
        : oh
    ));

    // Reset form
    setSignInForm({
      name: '',
      email: '',
      phone: '',
      preApproved: false,
      workingWithAgent: false,
      agentName: '',
      notes: ''
    });

    alert(`✅ ${signInForm.name} signed in successfully!`);
  };

  // Copy sign-in link
  const copySignInLink = (oh: OpenHouse) => {
    // In a real app, this would be a public URL. For demo, we'll simulate it.
    const link = `${window.location.origin}/open-house/${oh.id}/sign-in`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export visitors to leads (simulated)
  const exportToLeads = (oh: OpenHouse) => {
    alert(`✅ ${oh.visitors.length} visitors exported to Leads!\n\nIn production, these would be added to your CRM automatically.`);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if open house is today
  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  // Check if open house is past
  const isPast = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
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
            <HomeModernIcon className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Open Houses
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Create sign-in forms and capture leads at your open houses
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Open House
        </button>
      </div>

      {/* Open House List */}
      {openHouses.length === 0 ? (
        <div className="glass dark:glass-dark rounded-2xl p-12 text-center border border-white/30 dark:border-white/10">
          <HomeModernIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Open Houses Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first open house to start capturing leads
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            Create Open House
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {openHouses.map((oh) => (
            <div
              key={oh.id}
              className={`glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10 ${
                isToday(oh.date) ? 'ring-2 ring-green-500' : ''
              } ${isPast(oh.date) ? 'opacity-60' : ''}`}
            >
              {/* Status Badge */}
              {isToday(oh.date) && (
                <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full mb-3">
                  🔴 LIVE TODAY
                </span>
              )}
              {isPast(oh.date) && (
                <span className="inline-block px-3 py-1 bg-gray-500 text-white text-xs font-bold rounded-full mb-3">
                  COMPLETED
                </span>
              )}

              {/* Address */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {oh.address}
              </h3>

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {formatDate(oh.date)} • {oh.startTime} - {oh.endTime}
                </div>
                {oh.listPrice && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${oh.listPrice.toLocaleString()}
                    </span>
                    {oh.mlsNumber && <span className="text-gray-400">MLS# {oh.mlsNumber}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <UserPlusIcon className="w-4 h-4" />
                  {oh.visitors.length} visitor{oh.visitors.length !== 1 ? 's' : ''} signed in
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowSignInModal(oh)}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => copySignInLink(oh)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  title="Copy sign-in link"
                >
                  <ClipboardDocumentIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowVisitorsModal(oh)}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                  title="View visitors"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteOpenHouse(oh.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Copied Toast */}
      {copied && (
        <div className="fixed bottom-4 right-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" />
          Link copied!
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Create Open House
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Property Address *
                </label>
                <input
                  type="text"
                  placeholder="123 Main St, City, State 12345"
                  value={newOpenHouse.address}
                  onChange={(e) => setNewOpenHouse({ ...newOpenHouse, address: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newOpenHouse.date}
                    onChange={(e) => setNewOpenHouse({ ...newOpenHouse, date: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newOpenHouse.startTime}
                    onChange={(e) => setNewOpenHouse({ ...newOpenHouse, startTime: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newOpenHouse.endTime}
                    onChange={(e) => setNewOpenHouse({ ...newOpenHouse, endTime: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    List Price
                  </label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={newOpenHouse.listPrice}
                    onChange={(e) => setNewOpenHouse({ ...newOpenHouse, listPrice: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    MLS #
                  </label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={newOpenHouse.mlsNumber}
                    onChange={(e) => setNewOpenHouse({ ...newOpenHouse, mlsNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Additional details about the property..."
                  value={newOpenHouse.notes}
                  onChange={(e) => setNewOpenHouse({ ...newOpenHouse, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createOpenHouse}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Create Open House
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign-In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <HomeModernIcon className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Welcome!
              </h2>
              <p className="text-gray-500">{showSignInModal.address}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={signInForm.name}
                  onChange={(e) => setSignInForm({ ...signInForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={signInForm.email}
                  onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={signInForm.phone}
                  onChange={(e) => setSignInForm({ ...signInForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signInForm.preApproved}
                    onChange={(e) => setSignInForm({ ...signInForm, preApproved: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    I am pre-approved for a mortgage
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signInForm.workingWithAgent}
                    onChange={(e) => setSignInForm({ ...signInForm, workingWithAgent: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    I am currently working with an agent
                  </span>
                </label>

                {signInForm.workingWithAgent && (
                  <input
                    type="text"
                    placeholder="Agent's name"
                    value={signInForm.agentName}
                    onChange={(e) => setSignInForm({ ...signInForm, agentName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white ml-8"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes / Questions
                </label>
                <textarea
                  placeholder="Any questions about the property?"
                  value={signInForm.notes}
                  onChange={(e) => setSignInForm({ ...signInForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSignInModal(null)}
                className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addVisitor}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlusIcon className="w-5 h-5" />
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visitors Modal */}
      {showVisitorsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Visitors
                </h2>
                <p className="text-gray-500">{showVisitorsModal.address}</p>
              </div>
              <button
                onClick={() => exportToLeads(showVisitorsModal)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Export to Leads
              </button>
            </div>

            {showVisitorsModal.visitors.length === 0 ? (
              <div className="text-center py-8">
                <UserPlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No visitors yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {showVisitorsModal.visitors.map((v) => (
                  <div key={v.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{v.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{v.email}</p>
                        {v.phone && <p className="text-sm text-gray-600 dark:text-gray-400">{v.phone}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(v.signedInAt).toLocaleTimeString()}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {v.preApproved && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded text-xs">
                              Pre-Approved
                            </span>
                          )}
                          {v.workingWithAgent && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 rounded text-xs">
                              Has Agent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {v.notes && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">"{v.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowVisitorsModal(null)}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
