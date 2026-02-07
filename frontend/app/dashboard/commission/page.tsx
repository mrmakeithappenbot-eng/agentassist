'use client';

import { useState, useEffect } from 'react';
import {
  CalculatorIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

interface Deal {
  id: number;
  address: string;
  salePrice: number;
  commissionPercent: number;
  brokerSplitPercent: number;
  referralPercent: number;
  status: 'pending' | 'under_contract' | 'closed';
  closeDate?: string;
}

const STORAGE_KEY = 'agentassist_deals';

export default function CommissionPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Calculator state
  const [calc, setCalc] = useState({
    salePrice: '',
    commissionPercent: '3',
    brokerSplitPercent: '30',
    referralPercent: '0',
    address: '',
    closeDate: ''
  });

  // Load deals from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setDeals(JSON.parse(saved));
    }
    setDataLoaded(true);
  }, []);

  // Save deals to localStorage
  useEffect(() => {
    if (!dataLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  }, [deals, dataLoaded]);

  // Calculate commission breakdown
  const calculateCommission = (
    salePrice: number,
    commissionPercent: number,
    brokerSplitPercent: number,
    referralPercent: number
  ) => {
    const grossCommission = salePrice * (commissionPercent / 100);
    const brokerShare = grossCommission * (brokerSplitPercent / 100);
    const referralFee = grossCommission * (referralPercent / 100);
    const agentNet = grossCommission - brokerShare - referralFee;
    
    return {
      grossCommission,
      brokerShare,
      referralFee,
      agentNet
    };
  };

  const currentCalc = calculateCommission(
    parseFloat(calc.salePrice) || 0,
    parseFloat(calc.commissionPercent) || 0,
    parseFloat(calc.brokerSplitPercent) || 0,
    parseFloat(calc.referralPercent) || 0
  );

  // Add deal to pipeline
  const addDeal = () => {
    if (!calc.salePrice || !calc.address) {
      alert('Please enter address and sale price');
      return;
    }
    
    const newDeal: Deal = {
      id: Date.now(),
      address: calc.address,
      salePrice: parseFloat(calc.salePrice),
      commissionPercent: parseFloat(calc.commissionPercent) || 3,
      brokerSplitPercent: parseFloat(calc.brokerSplitPercent) || 30,
      referralPercent: parseFloat(calc.referralPercent) || 0,
      status: 'pending',
      closeDate: calc.closeDate || undefined
    };
    
    setDeals([...deals, newDeal]);
    setCalc({
      salePrice: '',
      commissionPercent: '3',
      brokerSplitPercent: '30',
      referralPercent: '0',
      address: '',
      closeDate: ''
    });
  };

  const updateDealStatus = (id: number, status: Deal['status']) => {
    setDeals(deals.map(d => d.id === id ? { ...d, status } : d));
  };

  const deleteDeal = (id: number) => {
    setDeals(deals.filter(d => d.id !== id));
  };

  // Pipeline totals
  const pipelineStats = {
    pending: deals.filter(d => d.status === 'pending'),
    underContract: deals.filter(d => d.status === 'under_contract'),
    closed: deals.filter(d => d.status === 'closed')
  };

  const totalPipelineValue = deals
    .filter(d => d.status !== 'closed')
    .reduce((sum, d) => {
      const { agentNet } = calculateCommission(d.salePrice, d.commissionPercent, d.brokerSplitPercent, d.referralPercent);
      return sum + agentNet;
    }, 0);

  const totalClosed = pipelineStats.closed.reduce((sum, d) => {
    const { agentNet } = calculateCommission(d.salePrice, d.commissionPercent, d.brokerSplitPercent, d.referralPercent);
    return sum + agentNet;
  }, 0);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <BackButton />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CurrencyDollarIcon className="w-8 h-8 text-green-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Commission Calculator
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Calculate earnings and track your deal pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <CalculatorIcon className="w-6 h-6" />
            Quick Calculator
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Property Address
              </label>
              <input
                type="text"
                placeholder="123 Main St, City, State"
                value={calc.address}
                onChange={(e) => setCalc({ ...calc, address: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sale Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  placeholder="500,000"
                  value={calc.salePrice}
                  onChange={(e) => setCalc({ ...calc, salePrice: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Commission %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calc.commissionPercent}
                  onChange={(e) => setCalc({ ...calc, commissionPercent: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Broker Split %
                </label>
                <input
                  type="number"
                  step="1"
                  value={calc.brokerSplitPercent}
                  onChange={(e) => setCalc({ ...calc, brokerSplitPercent: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Referral %
                </label>
                <input
                  type="number"
                  step="1"
                  value={calc.referralPercent}
                  onChange={(e) => setCalc({ ...calc, referralPercent: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                value={calc.closeDate}
                onChange={(e) => setCalc({ ...calc, closeDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Results */}
          {parseFloat(calc.salePrice) > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Commission Breakdown</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">Gross Commission ({calc.commissionPercent}%)</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${currentCalc.grossCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 text-red-600 dark:text-red-400">
                  <span className="flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    Broker Split ({calc.brokerSplitPercent}%)
                  </span>
                  <span>-${currentCalc.brokerShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                {parseFloat(calc.referralPercent) > 0 && (
                  <div className="flex justify-between items-center py-2 text-orange-600 dark:text-orange-400">
                    <span className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Referral Fee ({calc.referralPercent}%)
                    </span>
                    <span>-${currentCalc.referralFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3 border-t-2 border-green-500">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">Your Net Commission</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${currentCalc.agentNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={addDeal}
                className="w-full mt-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Add to Pipeline
              </button>
            </div>
          )}
        </div>

        {/* Pipeline Summary */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass dark:glass-dark rounded-2xl p-5 border border-white/30 dark:border-white/10">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Pipeline Value</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                ${totalPipelineValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                {pipelineStats.pending.length + pipelineStats.underContract.length} active deals
              </p>
            </div>
            <div className="glass dark:glass-dark rounded-2xl p-5 border border-white/30 dark:border-white/10">
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">Closed YTD</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                ${totalClosed.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-green-500 mt-1">
                {pipelineStats.closed.length} deals closed
              </p>
            </div>
          </div>

          {/* Deal Pipeline */}
          <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6" />
              Deal Pipeline
            </h2>

            {deals.length === 0 ? (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No deals yet. Use the calculator to add your first deal!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => {
                  const { agentNet } = calculateCommission(
                    deal.salePrice,
                    deal.commissionPercent,
                    deal.brokerSplitPercent,
                    deal.referralPercent
                  );
                  
                  const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                    under_contract: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                    closed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  };
                  
                  return (
                    <div key={deal.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{deal.address}</p>
                          <p className="text-sm text-gray-500">
                            ${deal.salePrice.toLocaleString()} • {deal.commissionPercent}% commission
                          </p>
                        </div>
                        <button
                          onClick={() => deleteDeal(deal.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {(['pending', 'under_contract', 'closed'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => updateDealStatus(deal.id, status)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                deal.status === status
                                  ? statusColors[status]
                                  : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300'
                              }`}
                            >
                              {status === 'under_contract' ? 'Under Contract' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                        <p className="font-bold text-green-600 dark:text-green-400">
                          ${agentNet.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
