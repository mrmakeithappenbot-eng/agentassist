'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CalculatorIcon,
  MapPinIcon,
  ReceiptPercentIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

// Google Maps API key - set in .env.local as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Extend window for Google Maps
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options?: any) => any;
        };
        DistanceMatrixService: new () => any;
        TravelMode: { DRIVING: string };
        UnitSystem: { IMPERIAL: number };
      };
    };
  }
}

export default function ExpensesPage() {
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || typeof window === 'undefined') return;
    
    // Check if already loaded
    if (window.google?.maps?.places) {
      setMapsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setMapsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Setup autocomplete when maps loads
  useEffect(() => {
    if (!mapsLoaded || !window.google?.maps?.places) return;

    const setupAutocomplete = (input: HTMLInputElement | null, field: 'from' | 'to') => {
      if (!input || !window.google?.maps?.places) return;
      
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        types: ['address'],
        componentRestrictions: { country: 'us' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setNewMileage(prev => ({ ...prev, [field]: place.formatted_address }));
        }
      });
    };

    setupAutocomplete(fromInputRef.current, 'from');
    setupAutocomplete(toInputRef.current, 'to');
  }, [mapsLoaded]);

  // Calculate distance between addresses
  const calculateDistance = async () => {
    if (!newMileage.from || !newMileage.to) {
      alert('Please enter both addresses');
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      alert('Google Maps API key not configured. Please enter miles manually.');
      return;
    }

    if (!window.google?.maps) {
      alert('Google Maps not loaded. Please enter miles manually.');
      return;
    }

    setIsCalculatingDistance(true);

    try {
      const google = window.google;
      if (!google?.maps) {
        setIsCalculatingDistance(false);
        alert('Google Maps not loaded');
        return;
      }
      
      const service = new google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix(
        {
          origins: [newMileage.from],
          destinations: [newMileage.to],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.IMPERIAL,
        },
        (response: any, status: any) => {
          setIsCalculatingDistance(false);
          
          if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
            const distanceText = response.rows[0].elements[0].distance.text;
            const miles = parseFloat(distanceText.replace(/[^0-9.]/g, ''));
            setNewMileage(prev => ({ ...prev, miles: miles.toFixed(1) }));
          } else {
            alert('Could not calculate distance. Please enter miles manually.');
          }
        }
      );
    } catch (error) {
      setIsCalculatingDistance(false);
      alert('Error calculating distance. Please enter miles manually.');
    }
  };

  // Expense tracking state
  const [expensePresets, setExpensePresets] = useState([
    { id: 1, name: 'Yard Sign', cost: 50, category: 'Marketing' },
    { id: 2, name: 'Lockbox', cost: 35, category: 'Equipment' },
    { id: 3, name: 'Photography Package', cost: 200, category: 'Marketing' },
    { id: 4, name: 'Staging Consultation', cost: 150, category: 'Services' },
  ]);
  const [mileageLog, setMileageLog] = useState<Array<{id: number; date: string; from: string; to: string; miles: number; purpose: string}>>([]);
  const [expenses, setExpenses] = useState<Array<{id: number; date: string; description: string; amount: number; category: string; receipt?: string}>>([
    { id: 1, date: '2026-01-01', description: 'AgentAssist CRM (Monthly)', amount: 50, category: 'Software' },
  ]);
  const [newPreset, setNewPreset] = useState({ name: '', cost: '', category: 'Marketing' });
  const [newMileage, setNewMileage] = useState({ date: '', from: '', to: '', miles: '', purpose: '' });
  const [newExpense, setNewExpense] = useState({ date: '', description: '', amount: '', category: 'Other' });
  const [activeTab, setActiveTab] = useState<'summary' | 'mileage' | 'expenses' | 'presets'>('summary');

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CalculatorIcon className="w-8 h-8 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Expenses
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Track expenses, mileage, and receipts for tax deductions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'summary', label: 'Summary' },
          { id: 'mileage', label: 'Mileage' },
          { id: 'expenses', label: 'Expenses' },
          { id: 'presets', label: 'Presets' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Mileage</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {mileageLog.reduce((sum, m) => sum + m.miles, 0).toLocaleString()} mi
              </p>
              <p className="text-sm text-blue-500 mt-1">
                ≈ ${(mileageLog.reduce((sum, m) => sum + m.miles, 0) * 0.67).toFixed(2)} deduction
              </p>
            </div>
            <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-green-500 mt-1">{expenses.length} transactions</p>
            </div>
            <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">YTD Deductions</p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                ${(expenses.reduce((sum, e) => sum + e.amount, 0) + mileageLog.reduce((sum, m) => sum + m.miles, 0) * 0.67).toFixed(2)}
              </p>
              <p className="text-sm text-purple-500 mt-1">2026 Tax Year</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {expenses.slice(0, 5).map((exp) => (
                <div key={exp.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{exp.description}</p>
                    <p className="text-xs text-gray-500">{exp.date} • {exp.category}</p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">${exp.amount}</p>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-gray-500 text-center py-4">No expenses recorded yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mileage Tab */}
      {activeTab === 'mileage' && (
        <div className="space-y-6">
          {/* Add Mileage Form */}
          <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Log Trip</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={newMileage.date}
                onChange={(e) => setNewMileage({...newMileage, date: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Purpose (e.g., Showing at 123 Main St)"
                value={newMileage.purpose}
                onChange={(e) => setNewMileage({...newMileage, purpose: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              <input
                ref={fromInputRef}
                type="text"
                placeholder="From address"
                value={newMileage.from}
                onChange={(e) => setNewMileage({...newMileage, from: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              <input
                ref={toInputRef}
                type="text"
                placeholder="To address"
                value={newMileage.to}
                onChange={(e) => setNewMileage({...newMileage, to: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Miles"
                  value={newMileage.miles}
                  onChange={(e) => setNewMileage({...newMileage, miles: e.target.value})}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
                <button
                  onClick={calculateDistance}
                  disabled={isCalculatingDistance || !newMileage.from || !newMileage.to}
                  className="px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isCalculatingDistance ? 'Calculating...' : '📍 Calculate'}
                </button>
              </div>
              <button
                onClick={() => {
                  if (newMileage.date && newMileage.miles) {
                    setMileageLog([...mileageLog, {
                      id: Date.now(),
                      ...newMileage,
                      miles: parseFloat(newMileage.miles)
                    }]);
                    setNewMileage({ date: '', from: '', to: '', miles: '', purpose: '' });
                  }
                }}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Add Trip
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              💡 2026 IRS mileage rate: $0.67/mile
              {GOOGLE_MAPS_API_KEY && ' • Start typing addresses for autocomplete'}
            </p>
            {!GOOGLE_MAPS_API_KEY && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable address autocomplete & auto-calculate
              </p>
            )}
          </div>

          {/* Mileage Log */}
          <div className="space-y-3">
            {mileageLog.map((trip) => (
              <div key={trip.id} className="glass dark:glass-dark rounded-xl p-4 border border-white/30 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <MapPinIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{trip.purpose || 'Business Trip'}</p>
                    <p className="text-sm text-gray-500">{trip.from} → {trip.to}</p>
                    <p className="text-xs text-gray-400">{trip.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{trip.miles} mi</p>
                  <p className="text-sm text-green-600">${(trip.miles * 0.67).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {mileageLog.length === 0 && (
              <div className="glass dark:glass-dark rounded-2xl p-12 text-center border border-white/30 dark:border-white/10">
                <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No trips logged yet. Add your first trip above!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Quick Add from Presets */}
          <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Add</h3>
            <div className="flex flex-wrap gap-2">
              {expensePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setExpenses([...expenses, {
                      id: Date.now(),
                      date: today,
                      description: preset.name,
                      amount: preset.cost,
                      category: preset.category
                    }]);
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {preset.name} <span className="text-gray-500">${preset.cost}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Add */}
          <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Add Expense</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              >
                <option value="Marketing">Marketing</option>
                <option value="Equipment">Equipment</option>
                <option value="Software">Software</option>
                <option value="Services">Services</option>
                <option value="Meals">Meals & Entertainment</option>
                <option value="Office">Office Supplies</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => {
                    if (newExpense.description && newExpense.amount) {
                      setExpenses([...expenses, {
                        id: Date.now(),
                        date: newExpense.date || new Date().toISOString().split('T')[0],
                        description: newExpense.description,
                        amount: parseFloat(newExpense.amount),
                        category: newExpense.category
                      }]);
                      setNewExpense({ date: '', description: '', amount: '', category: 'Other' });
                    }
                  }}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <input type="file" accept="image/*,.pdf" className="hidden" />
                <ReceiptPercentIcon className="w-5 h-5" />
                Attach receipt (optional)
              </label>
            </div>
          </div>

          {/* Expense List */}
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div key={exp.id} className="glass dark:glass-dark rounded-xl p-4 border border-white/30 dark:border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{exp.description}</p>
                  <p className="text-sm text-gray-500">{exp.date} • {exp.category}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-gray-900 dark:text-white">${exp.amount}</p>
                  <button
                    onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Presets Tab */}
      {activeTab === 'presets' && (
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Create presets for common expenses to quickly log them with one click.
          </p>

          {/* Add Preset Form */}
          <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Add Preset</h3>
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Name (e.g., Yard Sign)"
                value={newPreset.name}
                onChange={(e) => setNewPreset({...newPreset, name: e.target.value})}
                className="flex-1 min-w-[200px] px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="Cost"
                value={newPreset.cost}
                onChange={(e) => setNewPreset({...newPreset, cost: e.target.value})}
                className="w-28 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              <select
                value={newPreset.category}
                onChange={(e) => setNewPreset({...newPreset, category: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              >
                <option value="Marketing">Marketing</option>
                <option value="Equipment">Equipment</option>
                <option value="Services">Services</option>
                <option value="Other">Other</option>
              </select>
              <button
                onClick={() => {
                  if (newPreset.name && newPreset.cost) {
                    setExpensePresets([...expensePresets, {
                      id: Date.now(),
                      name: newPreset.name,
                      cost: parseFloat(newPreset.cost),
                      category: newPreset.category
                    }]);
                    setNewPreset({ name: '', cost: '', category: 'Marketing' });
                  }
                }}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preset List */}
          <div className="space-y-3">
            {expensePresets.map((preset) => (
              <div key={preset.id} className="glass dark:glass-dark rounded-xl p-4 border border-white/30 dark:border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{preset.name}</p>
                  <p className="text-sm text-gray-500">{preset.category}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-gray-900 dark:text-white">${preset.cost}</p>
                  <button
                    onClick={() => setExpensePresets(expensePresets.filter(p => p.id !== preset.id))}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
