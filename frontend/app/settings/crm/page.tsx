'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

// CRM providers as defined in the spec
const CRM_PROVIDERS = [
  { 
    id: 'followupboss', 
    name: 'Follow Up Boss', 
    auth: 'API Key / OAuth',
    description: 'Connect your Follow Up Boss account for lead management',
    logo: '📊'
  },
  { 
    id: 'kvcore', 
    name: 'kvCORE', 
    auth: 'Bearer Token',
    description: 'Integrate with kvCORE for MLS and lead distribution',
    logo: '🏢'
  },
  { 
    id: 'liondesk', 
    name: 'LionDesk', 
    auth: 'OAuth',
    description: 'Connect LionDesk for transaction management',
    logo: '🦁'
  },
  { 
    id: 'salesforce', 
    name: 'Salesforce', 
    auth: 'OAuth',
    description: 'Enterprise CRM integration with Salesforce',
    logo: '☁️'
  },
  { 
    id: 'hubspot', 
    name: 'HubSpot', 
    auth: 'OAuth',
    description: 'Connect HubSpot for marketing automation',
    logo: '🟠'
  },
  { 
    id: 'boomtown', 
    name: 'BoomTown', 
    auth: 'API Key',
    description: 'Integrate BoomTown for lead generation and nurture',
    logo: '💥'
  },
  { 
    id: 'boldtrail', 
    name: 'BoldTrail', 
    auth: 'API Key',
    description: 'Connect BoldTrail CRM for lead management and automation',
    logo: '🚀'
  },
];

export default function CRMSettings() {
  const router = useRouter();
  const [selectedCRM, setSelectedCRM] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [credentials, setCredentials] = useState({
    apiKey: '',
    bearerToken: '',
  });
  
  const handleConnect = async () => {
    if (!selectedCRM) return;
    
    setIsConnecting(true);
    
    try {
      // Call backend API to connect CRM
      const response = await fetch('http://localhost:8000/api/crm/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedCRM,
          credentials: {
            api_key: credentials.apiKey,
            bearer_token: credentials.bearerToken,
          }
        })
      });
      
      const data = await response.json();
      
      setIsConnecting(false);
      
      if (data.success) {
        setIsConnected(true);
        // Redirect to dashboard after successful connection
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      } else {
        alert('Connection failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setIsConnecting(false);
      alert('Error connecting to backend. Make sure the backend server is running.');
      console.error('Connection error:', error);
    }
  };
  
  const selectedProvider = CRM_PROVIDERS.find(p => p.id === selectedCRM);
  const requiresOAuth = selectedProvider?.auth.includes('OAuth');
  const requiresApiKey = selectedProvider?.auth.includes('API Key');
  const requiresBearerToken = selectedProvider?.auth.includes('Bearer Token');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            CRM Connection
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your existing CRM to enable AI automation for lead follow-up and prospecting.
          </p>
        </div>
        
        {/* Connection Status */}
        {isConnected && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    ✅ Connected to {selectedProvider?.name}!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        )}
        
        {/* CRM Provider Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Select Your CRM
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CRM_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedCRM(provider.id)}
                className={`
                  text-left p-6 rounded-lg border-2 transition-all
                  ${selectedCRM === provider.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }
                `}
              >
                <div className="text-4xl mb-3">{provider.logo}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {provider.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Auth: {provider.auth}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {provider.description}
                </p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Credentials Form */}
        {selectedCRM && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Connect {selectedProvider?.name}
            </h2>
            
            <div className="space-y-4">
              {requiresOAuth && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Click the button below to authenticate with {selectedProvider?.name} via OAuth 2.0.
                    You'll be redirected to their login page.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {isConnecting ? 'Connecting...' : `Authenticate with ${selectedProvider?.name}`}
                  </button>
                </div>
              )}
              
              {requiresApiKey && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={credentials.apiKey}
                    onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                    placeholder="Enter your API key"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Find your API key in {selectedProvider?.name} Settings → API Access
                  </p>
                </div>
              )}
              
              {requiresBearerToken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bearer Token
                  </label>
                  <input
                    type="password"
                    value={credentials.bearerToken}
                    onChange={(e) => setCredentials({ ...credentials, bearerToken: e.target.value })}
                    placeholder="Enter your bearer token"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Copy your bearer token from {selectedProvider?.name} account settings
                  </p>
                </div>
              )}
              
              {!requiresOAuth && (
                <div className="pt-4">
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting || (!credentials.apiKey && !credentials.bearerToken)}
                    className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {isConnecting ? 'Validating...' : 'Connect & Validate'}
                  </button>
                </div>
              )}
            </div>
            
            {/* Security Notice */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                🔐 <strong>Security:</strong> All credentials are encrypted at rest using AES-256-GCM encryption.
                Your API keys are never stored in plain text.
              </p>
            </div>
          </div>
        )}
        
        {/* Sync Settings */}
        {isConnected && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Cog6ToothIcon className="w-6 h-6 mr-2" />
              Sync Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Sync Frequency</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    How often to check for new leads
                  </p>
                </div>
                <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every hour</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Auto-Pilot Mode</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Send messages automatically without approval
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
