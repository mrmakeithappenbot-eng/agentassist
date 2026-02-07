'use client';

import { useState, useEffect } from 'react';
import {
  CalculatorIcon,
  MapPinIcon,
  ReceiptPercentIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

// LocalStorage keys
const STORAGE_KEYS = {
  mileageLog: 'agentassist_mileage_log',
  expenses: 'agentassist_expenses',
  presets: 'agentassist_expense_presets',
  homeLocation: 'agentassist_home_location',
};

// Type for a stop in multi-stop trip
interface TripStop {
  id: number;
  address: string;
  coords: { lat: number; lon: number } | null;
}

export default function ExpensesPage() {
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  
  // Multi-stop trip state
  const [tripStops, setTripStops] = useState<TripStop[]>([
    { id: 1, address: '', coords: null },
    { id: 2, address: '', coords: null }
  ]);
  const [activeStopId, setActiveStopId] = useState<number | null>(null);
  const [stopSuggestions, setStopSuggestions] = useState<Array<{display: string; lat: number; lon: number}>>([]);
  const [calculatedMiles, setCalculatedMiles] = useState<number | null>(null);
  const [legDistances, setLegDistances] = useState<number[]>([]);

  // Search addresses using Photon (free OpenStreetMap geocoder)
  const searchAddress = async (query: string, stopId?: number) => {
    if (query.length < 3) {
      setStopSuggestions([]);
      return;
    }

    try {
      // Build URL with optional location bias
      let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`;
      if (homeLocation) {
        url += `&lat=${homeLocation.lat}&lon=${homeLocation.lon}`;
      }
      
      const response = await fetch(url);
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
      
      setStopSuggestions(suggestions);
      if (stopId) setActiveStopId(stopId);
    } catch (error) {
      console.error('Address search error:', error);
    }
  };

  // Update a stop's address
  const updateStop = (stopId: number, address: string, coords: { lat: number; lon: number } | null = null) => {
    setTripStops(stops => stops.map(s => 
      s.id === stopId ? { ...s, address, coords } : s
    ));
    // Reset calculated miles when addresses change
    setCalculatedMiles(null);
    setLegDistances([]);
  };

  // Add a new stop
  const addStop = () => {
    const newId = Math.max(...tripStops.map(s => s.id)) + 1;
    setTripStops([...tripStops, { id: newId, address: '', coords: null }]);
  };

  // Remove a stop (keep at least 2)
  const removeStop = (stopId: number) => {
    if (tripStops.length <= 2) return;
    setTripStops(stops => stops.filter(s => s.id !== stopId));
    setCalculatedMiles(null);
    setLegDistances([]);
  };

  // Search for location (city/area)
  const searchLocation = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`
      );
      const data = await response.json();
      
      const suggestions = data.features?.map((f: any) => ({
        display: [
          f.properties.city || f.properties.name,
          f.properties.state,
          f.properties.country
        ].filter(Boolean).join(', '),
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0]
      })) || [];
      
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Location search error:', error);
    }
  };

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get city name
        try {
          const response = await fetch(
            `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const place = data.features?.[0]?.properties;
          const name = place?.city || place?.name || 'Your Location';
          
          setHomeLocation({ lat: latitude, lon: longitude, name });
          setShowLocationModal(false);
        } catch (e) {
          setHomeLocation({ lat: latitude, lon: longitude, name: 'Your Location' });
          setShowLocationModal(false);
        }
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        alert('Could not get your location. Please search for your city instead.');
      }
    );
  };

  // Calculate distance using OSRM (free routing service) for multi-stop trips
  const calculateDistance = async () => {
    // Check all stops have coordinates
    const stopsWithCoords = tripStops.filter(s => s.coords);
    if (stopsWithCoords.length < 2) {
      alert('Please select at least 2 addresses from the dropdown suggestions');
      return;
    }

    setIsCalculatingDistance(true);
    const legs: number[] = [];

    try {
      // Build waypoints string for OSRM (lon,lat;lon,lat;...)
      const waypoints = stopsWithCoords
        .map(s => `${s.coords!.lon},${s.coords!.lat}`)
        .join(';');

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=false&steps=false`
      );
      const data = await response.json();

      if (data.code === 'Ok' && data.routes?.[0]) {
        // Get individual leg distances
        data.routes[0].legs?.forEach((leg: any) => {
          const miles = leg.distance / 1609.344;
          legs.push(parseFloat(miles.toFixed(1)));
        });

        // Total distance
        const totalMeters = data.routes[0].distance;
        const totalMiles = parseFloat((totalMeters / 1609.344).toFixed(1));
        
        setCalculatedMiles(totalMiles);
        setLegDistances(legs);
        setNewMileage(prev => ({ ...prev, miles: totalMiles.toString() }));
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

  // Expense tracking state - initialized empty, loaded from localStorage in useEffect
  const [expensePresets, setExpensePresets] = useState<Array<{id: number; name: string; cost: number; category: string}>>([]);
  const [mileageLog, setMileageLog] = useState<Array<{id: number; date: string; stops: string[]; miles: number; purpose: string; legDistances?: number[]}>>([]);
  const [expenses, setExpenses] = useState<Array<{id: number; date: string; description: string; amount: number; category: string; receipt?: string}>>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Home location for biasing address search
  const [homeLocation, setHomeLocation] = useState<{lat: number; lon: number; name: string} | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{display: string; lat: number; lon: number}>>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedMileage = localStorage.getItem(STORAGE_KEYS.mileageLog);
      const savedExpenses = localStorage.getItem(STORAGE_KEYS.expenses);
      const savedPresets = localStorage.getItem(STORAGE_KEYS.presets);
      
      if (savedMileage) {
        setMileageLog(JSON.parse(savedMileage));
      }
      
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      } else {
        // Default CRM expense
        setExpenses([{ id: 1, date: '2026-01-01', description: 'AgentAssist CRM (Monthly)', amount: 50, category: 'Software' }]);
      }
      
      if (savedPresets) {
        setExpensePresets(JSON.parse(savedPresets));
      } else {
        // Default presets
        setExpensePresets([
          { id: 1, name: 'Yard Sign', cost: 50, category: 'Marketing' },
          { id: 2, name: 'Lockbox', cost: 35, category: 'Equipment' },
          { id: 3, name: 'Photography Package', cost: 200, category: 'Marketing' },
          { id: 4, name: 'Staging Consultation', cost: 150, category: 'Services' },
        ]);
      }
      
      const savedLocation = localStorage.getItem(STORAGE_KEYS.homeLocation);
      if (savedLocation) {
        setHomeLocation(JSON.parse(savedLocation));
      }
    } catch (e) {
      console.error('Error loading expense data:', e);
    }
    
    setDataLoaded(true);
  }, []);

  // Save home location when it changes
  useEffect(() => {
    if (!dataLoaded) return;
    if (homeLocation) {
      localStorage.setItem(STORAGE_KEYS.homeLocation, JSON.stringify(homeLocation));
    }
  }, [homeLocation, dataLoaded]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!dataLoaded) return; // Don't save during initial load
    localStorage.setItem(STORAGE_KEYS.mileageLog, JSON.stringify(mileageLog));
  }, [mileageLog, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
  }, [expenses, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(expensePresets));
  }, [expensePresets, dataLoaded]);
  const [newPreset, setNewPreset] = useState({ name: '', cost: '', category: 'Marketing' });
  const [newMileage, setNewMileage] = useState({ date: '', miles: '', purpose: '' });
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
          {/* Location Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {homeLocation ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                  📍 Searching near {homeLocation.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                  🌍 No location set
                </span>
              )}
            </div>
            <button
              onClick={() => setShowLocationModal(true)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {homeLocation ? 'Change Location' : 'Set My Location'}
            </button>
          </div>

          {/* Add Mileage Form - Multi-Stop */}
          <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Log Trip</h3>
            
            {/* Date & Purpose */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="date"
                value={newMileage.date}
                onChange={(e) => setNewMileage({...newMileage, date: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Purpose (e.g., Showings Tour)"
                value={newMileage.purpose}
                onChange={(e) => setNewMileage({...newMileage, purpose: e.target.value})}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            {/* Multi-Stop Route Builder */}
            <div className="space-y-3 mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Route ({tripStops.length} stops)
              </label>
              
              {tripStops.map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-2">
                  {/* Stop number indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    stop.coords 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {index === 0 ? '🏠' : index === tripStops.length - 1 ? '🏁' : index}
                  </div>
                  
                  {/* Address input */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={index === 0 ? 'Starting point...' : index === tripStops.length - 1 ? 'Final destination...' : `Stop ${index}...`}
                      value={stop.address}
                      onChange={(e) => {
                        updateStop(stop.id, e.target.value);
                        searchAddress(e.target.value, stop.id);
                      }}
                      onFocus={() => {
                        if (stopSuggestions.length > 0) setActiveStopId(stop.id);
                      }}
                      onBlur={() => setTimeout(() => setActiveStopId(null), 200)}
                      className={`w-full px-4 py-3 rounded-xl text-gray-900 dark:text-white ${
                        stop.coords 
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' 
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    />
                    {/* Dropdown for this stop */}
                    {activeStopId === stop.id && stopSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                        {stopSuggestions.map((s, i) => (
                          <button
                            key={i}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              updateStop(stop.id, s.display, { lat: s.lat, lon: s.lon });
                              setStopSuggestions([]);
                              setActiveStopId(null);
                            }}
                          >
                            📍 {s.display}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Remove button (only show if more than 2 stops) */}
                  {tripStops.length > 2 && (
                    <button
                      onClick={() => removeStop(stop.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove stop"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add Stop Button */}
              <button
                onClick={addStop}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Add Stop
              </button>
            </div>

            {/* Leg Distances Breakdown (if calculated) */}
            {legDistances.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Route Breakdown:</p>
                <div className="space-y-1">
                  {legDistances.map((miles, i) => (
                    <div key={i} className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                      <span>
                        {tripStops[i]?.address?.split(',')[0] || `Stop ${i + 1}`} → {tripStops[i + 1]?.address?.split(',')[0] || `Stop ${i + 2}`}
                      </span>
                      <span className="font-medium">{miles} mi</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold text-blue-700 dark:text-blue-300 pt-2 border-t border-blue-200 dark:border-blue-800">
                    <span>Total</span>
                    <span>{calculatedMiles} mi (${(calculatedMiles! * 0.67).toFixed(2)} deduction)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Miles input (manual override) */}
            <div className="flex gap-3 mb-4">
              <input
                type="number"
                placeholder="Total miles (or use Calculate)"
                value={newMileage.miles}
                onChange={(e) => setNewMileage({...newMileage, miles: e.target.value})}
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={calculateDistance}
                disabled={isCalculatingDistance || tripStops.filter(s => s.coords).length < 2}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={tripStops.filter(s => s.coords).length < 2 ? 'Select at least 2 addresses from dropdowns' : 'Calculate driving distance'}
              >
                {isCalculatingDistance ? '⏳ Calculating...' : `🚗 Calculate Route (${tripStops.filter(s => s.coords).length}/${tripStops.length} stops)`}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newMileage.date) {
                    alert('Please select a date');
                    return;
                  }
                  if (!newMileage.miles) {
                    alert('Please enter miles (or use Calculate Route)');
                    return;
                  }
                  const stops = tripStops.map(s => s.address).filter(Boolean);
                  if (stops.length < 2) {
                    alert('Please enter at least 2 addresses');
                    return;
                  }
                  setMileageLog([...mileageLog, {
                    id: Date.now(),
                    date: newMileage.date,
                    purpose: newMileage.purpose,
                    stops,
                    miles: parseFloat(newMileage.miles),
                    legDistances: legDistances.length > 0 ? legDistances : undefined
                  }]);
                  // Reset form
                  setNewMileage({ date: '', miles: '', purpose: '' });
                  setTripStops([
                    { id: 1, address: '', coords: null },
                    { id: 2, address: '', coords: null }
                  ]);
                  setCalculatedMiles(null);
                  setLegDistances([]);
                  alert('Trip added!');
                }}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                ✅ Add Trip
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              💡 2026 IRS mileage rate: $0.67/mile • Add multiple stops for showing tours!
            </p>
          </div>

          {/* Mileage Log */}
          <div className="space-y-3">
            {mileageLog.map((trip) => (
              <div key={trip.id} className="glass dark:glass-dark rounded-xl p-4 border border-white/30 dark:border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPinIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{trip.purpose || 'Business Trip'}</p>
                      <p className="text-sm text-gray-500">
                        {trip.stops ? (
                          trip.stops.length <= 3 
                            ? trip.stops.map(s => s.split(',')[0]).join(' → ')
                            : `${trip.stops[0]?.split(',')[0]} → ${trip.stops.length - 2} stops → ${trip.stops[trip.stops.length - 1]?.split(',')[0]}`
                        ) : (
                          // Legacy support for old from/to format
                          `${(trip as any).from || ''} → ${(trip as any).to || ''}`
                        )}
                      </p>
                      {trip.stops && trip.stops.length > 2 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {trip.stops.length} stops total
                        </p>
                      )}
                      <p className="text-xs text-gray-400">{trip.date}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{trip.miles} mi</p>
                    <p className="text-sm text-green-600">${(trip.miles * 0.67).toFixed(2)}</p>
                    <button
                      onClick={() => setMileageLog(mileageLog.filter(t => t.id !== trip.id))}
                      className="text-red-500 hover:text-red-700 mt-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Set Your Location
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              This helps find addresses in your area faster.
            </p>

            {/* Use Current Location Button */}
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full mb-4 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGettingLocation ? (
                <>⏳ Getting location...</>
              ) : (
                <>📍 Use My Current Location</>
              )}
            </button>

            <div className="text-center text-gray-500 text-sm mb-4">— or search —</div>

            {/* Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search city or area..."
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  searchLocation(e.target.value);
                }}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
              {locationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
                  {locationSuggestions.map((loc, i) => (
                    <button
                      key={i}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                      onClick={() => {
                        setHomeLocation({ lat: loc.lat, lon: loc.lon, name: loc.display.split(',')[0] });
                        setShowLocationModal(false);
                        setLocationSearch('');
                        setLocationSuggestions([]);
                      }}
                    >
                      📍 {loc.display}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current Location Display */}
            {homeLocation && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Current: <strong>{homeLocation.name}</strong>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setLocationSearch('');
                  setLocationSuggestions([]);
                }}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              {homeLocation && (
                <button
                  onClick={() => {
                    setHomeLocation(null);
                    localStorage.removeItem(STORAGE_KEYS.homeLocation);
                    setShowLocationModal(false);
                  }}
                  className="flex-1 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  Clear Location
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
