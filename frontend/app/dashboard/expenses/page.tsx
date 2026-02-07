'use client';

import { useState, useRef } from 'react';
import {
  CalculatorIcon,
  MapPinIcon,
  ReceiptPercentIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

export default function ExpensesPage() {
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<Array<{display: string; lat: number; lon: number}>>([]);
  const [toSuggestions, setToSuggestions] = useState<Array<{display: string; lat: number; lon: number}>>([]);
  const [fromCoords, setFromCoords] = useState<{lat: number; lon: number} | null>(null);
  const [toCoords, setToCoords] = useState<{lat: number; lon: number} | null>(null);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  // Search addresses using Photon (free OpenStreetMap geocoder)
  const searchAddress = async (query: string, setSuggestions: (s: any[]) => void) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`
      );
      const data = await response.json();
      
      const suggestions = data.features?.map((f: any) => ({
        display: [
          f.properties.name,
          f.properties.street,
          f.properties.housenumber,
          f.properties.city,
          f.properties.state,
          f.properties.postcode
        ].filter(Boolean).join(', '),
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0]
      })) || [];
      
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Address search error:', error);
    }
  };

  // Calculate distance using OSRM (free routing service)
  const calculateDistance = async () => {
    if (!fromCoords || !toCoords) {
      alert('Please select addresses from the dropdown suggestions');
      return;
    }

    setIsCalculatingDistance(true);

    try {
      // OSRM expects lon,lat format
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?overview=false`
      );
      const data = await response.json();

      if (data.code === 'Ok' && data.routes?.[0]) {
        // Distance is in meters, convert to miles
        const meters = data.routes[0].distance;
        const miles = meters / 1609.344;
        setNewMileage(prev => ({ ...prev, miles: miles.toFixed(1) }));
      } else {
        alert('Could not calculate route. Please enter miles manually.');
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      alert('Error calculating distance. Please enter miles manually.');
    } finally {
      setIsCalculatingDistance(false);
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
              <div className="relative">
                <input
                  type="text"
                  placeholder="From address (start typing...)"
                  value={newMileage.from}
                  onChange={(e) => {
                    setNewMileage({...newMileage, from: e.target.value});
                    searchAddress(e.target.value, setFromSuggestions);
                    setShowFromDropdown(true);
                    setFromCoords(null);
                  }}
                  onFocus={() => fromSuggestions.length > 0 && setShowFromDropdown(true)}
                  onBlur={() => setTimeout(() => setShowFromDropdown(false), 200)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
                {showFromDropdown && fromSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                    {fromSuggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        onClick={() => {
                          setNewMileage(prev => ({ ...prev, from: s.display }));
                          setFromCoords({ lat: s.lat, lon: s.lon });
                          setShowFromDropdown(false);
                          setFromSuggestions([]);
                        }}
                      >
                        📍 {s.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="To address (start typing...)"
                  value={newMileage.to}
                  onChange={(e) => {
                    setNewMileage({...newMileage, to: e.target.value});
                    searchAddress(e.target.value, setToSuggestions);
                    setShowToDropdown(true);
                    setToCoords(null);
                  }}
                  onFocus={() => toSuggestions.length > 0 && setShowToDropdown(true)}
                  onBlur={() => setTimeout(() => setShowToDropdown(false), 200)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
                {showToDropdown && toSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                    {toSuggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        onClick={() => {
                          setNewMileage(prev => ({ ...prev, to: s.display }));
                          setToCoords({ lat: s.lat, lon: s.lon });
                          setShowToDropdown(false);
                          setToSuggestions([]);
                        }}
                      >
                        📍 {s.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                placeholder="Miles"
                value={newMileage.miles}
                onChange={(e) => setNewMileage({...newMileage, miles: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Action Buttons - Separate Row */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                type="button"
                onClick={calculateDistance}
                disabled={isCalculatingDistance || !fromCoords || !toCoords}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!fromCoords || !toCoords ? 'Select addresses from dropdown first' : 'Calculate driving distance'}
              >
                {isCalculatingDistance ? '⏳ Calculating...' : '🚗 Calculate Distance'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newMileage.date) {
                    alert('Please select a date');
                    return;
                  }
                  if (!newMileage.miles) {
                    alert('Please enter miles (or use Calculate Distance)');
                    return;
                  }
                  setMileageLog([...mileageLog, {
                    id: Date.now(),
                    ...newMileage,
                    miles: parseFloat(newMileage.miles)
                  }]);
                  setNewMileage({ date: '', from: '', to: '', miles: '', purpose: '' });
                  setFromCoords(null);
                  setToCoords(null);
                  alert('Trip added!');
                }}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                ✅ Add Trip
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              💡 2026 IRS mileage rate: $0.67/mile • Start typing for address suggestions
            </p>
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
