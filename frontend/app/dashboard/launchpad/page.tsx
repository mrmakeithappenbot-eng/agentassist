'use client';

import { useState } from 'react';
import { 
  PhotoIcon, 
  SparklesIcon,
  DocumentTextIcon,
  ShareIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';

export default function LaunchpadPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const imageUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages([...uploadedImages, ...imageUrls]);
    }
  };
  
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setResults({
        features: [
          'Granite countertops',
          'Hardwood floors',
          'Stainless steel appliances',
          'Crown molding',
          'Updated lighting fixtures',
          'Open floor plan',
          'Large windows with natural light',
          'Modern backsplash'
        ],
        descriptions: {
          emotional: "Welcome home to this stunning property where modern elegance meets everyday comfort. Step inside and be greeted by gorgeous hardwood floors that flow throughout the open living spaces. The chef's kitchen boasts gleaming granite countertops and premium stainless steel appliances, perfect for both casual dinners and entertaining. Natural light floods through large windows, creating a warm and inviting atmosphere that will make you never want to leave.",
          analytical: "Well-maintained 3BR/2BA single-family residence featuring 2,100 sq ft of updated living space. Recent renovations include granite countertops (2022), hardwood flooring (2021), and modern lighting fixtures. Open-concept layout with 9-foot ceilings. Kitchen equipped with stainless steel appliances including gas range and dishwasher. Energy-efficient dual-pane windows. Central HVAC system. Two-car attached garage. HOA: $150/month.",
          seo: "Updated 3-bedroom home in Austin TX | Granite counters | Hardwood floors | Open floor plan | Modern kitchen | Stainless appliances | Natural light | Move-in ready | Great schools | Near downtown"
        },
        socialCaptions: [
          {
            platform: 'Instagram',
            caption: "✨ Just Listed! This stunning 3BR home has everything you've been looking for. Granite counters, hardwood floors, and natural light galore! 🏡 DM for showings.\n\n#AustinRealEstate #JustListed #DreamHome #ModernLiving #OpenHouse #AustinTX #RealEstateAgent #HomeForSale #LuxuryHome #HouseHunting",
            hashtags: 12
          },
          {
            platform: 'Facebook',
            caption: "🏡 NEW LISTING ALERT! 🏡\n\nThis beautiful 3-bedroom, 2-bath home in Austin won't last long! Features include:\n\n✅ Granite countertops\n✅ Hardwood floors\n✅ Stainless steel appliances\n✅ Open floor plan\n✅ Updated throughout\n\nPriced at $625,000. Schedule your showing today!\n\nCall or DM for more details. 📞",
            hashtags: 0
          },
          {
            platform: 'Twitter/X',
            caption: "🚨 JUST LISTED 🚨\n\n3BR/2BA | $625K | Austin, TX\nGranite counters • Hardwood floors • Modern kitchen\n\nThis one won't last! DM for details 👇\n\n#AustinRealEstate #JustListed #ATX",
            hashtags: 3
          }
        ],
        flyerData: {
          headline: "Modern Elegance Meets Everyday Comfort",
          features: [
            "3 Bedrooms | 2 Bathrooms",
            "2,100 Square Feet",
            "Granite Countertops",
            "Hardwood Floors Throughout",
            "Stainless Steel Appliances",
            "Open Floor Plan",
            "Updated Lighting & Crown Molding",
            "Large Windows with Natural Light",
            "Two-Car Garage",
            "Low HOA ($150/month)"
          ]
        }
      });
      setIsAnalyzing(false);
    }, 3000);
  };
  
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <BackButton />
      </div>
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <SparklesIcon className="w-8 h-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Listing Launchpad
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Upload property photos and let AI generate professional marketing content
        </p>
      </div>
      
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Step 1: Upload Property Photos
        </h2>
        
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Click to upload property images
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              PNG, JPG, JPEG up to 10MB each
            </p>
          </label>
        </div>
        
        {/* Image Preview Grid */}
        {uploadedImages.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Uploaded Images ({uploadedImages.length})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src={url} 
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {uploadedImages.length > 0 && (
          <div className="mt-6">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full md:w-auto px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing with AI Vision...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generate Marketing Content
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {/* Detected Features */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <CheckCircleIcon className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI Detected Features
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {results.features.map((feature: string, index: number) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
          
          {/* Property Descriptions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Property Descriptions
              </h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  📖 Emotional / Storytelling
                </h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  {results.descriptions.emotional}
                </p>
                <button className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  Copy to clipboard
                </button>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  📊 Analytical / Investor
                </h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  {results.descriptions.analytical}
                </p>
                <button className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  Copy to clipboard
                </button>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🔍 SEO Optimized
                </h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg font-mono text-sm">
                  {results.descriptions.seo}
                </p>
                <button className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  Copy to clipboard
                </button>
              </div>
            </div>
          </div>
          
          {/* Social Media Captions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ShareIcon className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Social Media Captions
                </h2>
              </div>
            </div>
            
            <div className="space-y-4">
              {results.socialCaptions.map((item: any, index: number) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {item.platform}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.hashtags} hashtags
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {item.caption}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      Copy
                    </button>
                    <button className="text-sm text-green-600 dark:text-green-400 hover:underline">
                      Schedule Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Flyer Data */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📄 Flyer Data (Ready for PDF Generator)
            </h2>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {results.flyerData.headline}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.flyerData.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            
            <button className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Download Flyer JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
