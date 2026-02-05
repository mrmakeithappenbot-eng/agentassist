'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center text-white">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          AgentAssist
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-primary-100">
          Deploy Autonomous AI Employees for Your Real Estate Business
        </p>
        <p className="text-lg mb-12 text-primary-200 max-w-2xl mx-auto">
          Connect your CRM, let our AI handle lead follow-up, prospecting, and marketing.
          Never miss a lead again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-white text-primary-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-500 transition-colors border border-primary-500"
          >
            Sign In
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🎯 Smart Follow-Up</h3>
            <p className="text-primary-100">
              AI-generated personalized messages for every lead. Manual approval or full autopilot.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🔍 The Hunter</h3>
            <p className="text-primary-100">
              Automated FSBO & expired listing scraper. Never run out of prospects.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">🚀 Marketing AI</h3>
            <p className="text-primary-100">
              One-click listing descriptions, social posts, and flyers with AI vision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
