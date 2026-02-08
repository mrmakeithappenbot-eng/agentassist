'use client';

import { useState, useCallback } from 'react';
import { 
  PhotoIcon, 
  SparklesIcon,
  DocumentTextIcon,
  ShareIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

interface AnalysisResult {
  features: string[];
  descriptions: {
    emotional: string;
    analytical: string;
    seo: string;
  };
  socialCaptions: {
    platform: string;
    caption: string;
  }[];
}

export default function LaunchpadPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [propertyDetails, setPropertyDetails] = useState({
    address: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...imageUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleAnalyze = async () => {
    if (uploadedImages.length === 0) {
      setError('Please upload at least one property photo');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    // TODO: Integrate with OpenAI Vision API for real analysis
    // For now, show a placeholder message
    setTimeout(() => {
      setIsAnalyzing(false);
      setError('AI analysis integration coming soon! This will use GPT-4 Vision to analyze your property photos and generate professional descriptions.');
    }, 2000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setUploadedImages([]);
    setResults(null);
    setPropertyDetails({ address: '', price: '', bedrooms: '', bathrooms: '', sqft: '' });
    setError(null);
  };
  
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Listing Launchpad</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Upload property photos to generate AI-powered descriptions and social media content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload & Details */}
        <div className="space-y-6">
          {/* Photo Upload */}
          <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <PhotoIcon className="w-5 h-5 text-primary-500" />
              Property Photos
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-primary-500 smooth-transition">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag photos here or <span className="text-primary-600 font-medium">browse</span>
                </p>
                <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
              </label>
            </div>

            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Property ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full 
                        opacity-0 group-hover:opacity-100 smooth-transition flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-primary-500" />
              Property Details (Optional)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
                <input
                  type="text"
                  value={propertyDetails.address}
                  onChange={(e) => setPropertyDetails(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, Austin, TX"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                    text-gray-900 dark:text-white placeholder-gray-400
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price</label>
                  <input
                    type="text"
                    value={propertyDetails.price}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="$450,000"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                      text-gray-900 dark:text-white placeholder-gray-400
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sq Ft</label>
                  <input
                    type="text"
                    value={propertyDetails.sqft}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, sqft: e.target.value }))}
                    placeholder="2,100"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                      text-gray-900 dark:text-white placeholder-gray-400
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bedrooms</label>
                  <input
                    type="number"
                    value={propertyDetails.bedrooms}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, bedrooms: e.target.value }))}
                    placeholder="3"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                      text-gray-900 dark:text-white placeholder-gray-400
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bathrooms</label>
                  <input
                    type="text"
                    value={propertyDetails.bathrooms}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, bathrooms: e.target.value }))}
                    placeholder="2.5"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 
                      text-gray-900 dark:text-white placeholder-gray-400
                      focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleAnalyze}
              disabled={uploadedImages.length === 0 || isAnalyzing}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl 
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 smooth-transition"
            >
              {isAnalyzing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate Content
                </>
              )}
            </button>
            
            {(uploadedImages.length > 0 || results) && (
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 
                  text-gray-700 dark:text-gray-300 font-semibold rounded-xl smooth-transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Coming Soon Notice */}
          {!results && (
            <div className="glass dark:glass-dark rounded-2xl p-8 border border-white/30 dark:border-white/10">
              <div className="text-center">
                <SparklesIcon className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Content Generation</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Upload property photos and our AI will analyze them to generate:
                </p>
                
                <div className="grid grid-cols-1 gap-3 text-left max-w-sm mx-auto">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Property feature highlights</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">MLS-ready descriptions</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">Social media captions</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">SEO-optimized text</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error/Status Message */}
          {error && (
            <div className="glass dark:glass-dark rounded-2xl p-6 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Coming Soon</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results would go here when AI integration is complete */}
          {results && (
            <div className="space-y-6">
              {/* Features */}
              <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detected Features</h3>
                <div className="flex flex-wrap gap-2">
                  {results.features.map((feature, i) => (
                    <span key={i} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              {Object.entries(results.descriptions).map(([type, text]) => (
                <div key={type} className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{type} Description</h3>
                    <button
                      onClick={() => handleCopy(text, type)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg smooth-transition"
                    >
                      <ClipboardDocumentIcon className={`w-5 h-5 ${copied === type ? 'text-green-500' : 'text-gray-500'}`} />
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">{text}</p>
                </div>
              ))}

              {/* Social Captions */}
              <div className="glass dark:glass-dark rounded-2xl p-6 border border-white/30 dark:border-white/10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ShareIcon className="w-5 h-5 text-primary-500" />
                  Social Media Captions
                </h3>
                <div className="space-y-4">
                  {results.socialCaptions.map((item, i) => (
                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{item.platform}</span>
                        <button
                          onClick={() => handleCopy(item.caption, `social-${i}`)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg smooth-transition"
                        >
                          <ClipboardDocumentIcon className={`w-4 h-4 ${copied === `social-${i}` ? 'text-green-500' : 'text-gray-500'}`} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{item.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
