'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

export default function ImportLeadsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a CSV file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/leads/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setImportedCount(data.imported);
        setTimeout(() => {
          router.push('/dashboard/leads');
        }, 2000);
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError('Error uploading file. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const downloadSample = () => {
    const sample = `first_name,last_name,email,phone,status,location,price_min,price_max,tags
John,Smith,john@example.com,555-0100,Active,"Los Angeles, CA",300000,500000,buyer
Jane,Doe,jane@example.com,555-0101,New,"San Diego, CA",400000,600000,seller;lead
Mike,Johnson,mike@example.com,555-0102,Active,"Phoenix, AZ",250000,400000,buyer;hot`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
              Import Successful!
            </h2>
            <p className="text-green-700 dark:text-green-300 mb-4">
              {importedCount} leads imported successfully
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Redirecting to your leads...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Import Leads
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a CSV file from your CRM to import all your leads at once
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📋 How to Import:
          </h3>
          <ol className="space-y-2 text-blue-800 dark:text-blue-200">
            <li><strong>1.</strong> Export your leads from your CRM as a CSV file</li>
            <li><strong>2.</strong> Make sure it includes: Name, Email, Phone (at minimum)</li>
            <li><strong>3.</strong> Drag & drop the file below, or click to browse</li>
            <li><strong>4.</strong> Click "Import Leads" and you're done!</li>
          </ol>
          <button
            onClick={downloadSample}
            className="mt-4 inline-flex items-center text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Download Sample CSV
          </button>
        </div>

        {/* Upload Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${isDragging 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
              }
            `}
          >
            <ArrowUpTrayIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            
            {file ? (
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Drag & drop your CSV file here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Import Button */}
          {file && !error && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleImport}
                disabled={uploading}
                className={`
                  px-8 py-4 rounded-lg font-semibold text-lg transition-colors
                  ${uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }
                `}
              >
                {uploading ? 'Importing...' : `Import ${file.name}`}
              </button>
            </div>
          )}
        </div>

        {/* Supported Fields */}
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            📊 Supported CSV Columns:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div>✓ first_name</div>
            <div>✓ last_name</div>
            <div>✓ email</div>
            <div>✓ phone</div>
            <div>✓ status</div>
            <div>✓ location</div>
            <div>✓ price_min</div>
            <div>✓ price_max</div>
            <div>✓ tags</div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Don't worry - the import will work with any column names! We'll automatically detect them.
          </p>
        </div>
      </div>
    </div>
  );
}
