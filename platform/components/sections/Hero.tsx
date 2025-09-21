'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, Shield, Zap, Eye, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Hero() {
  const router = useRouter();

  const handleForensicsClick = (e) => {
    console.log('Forensics link clicked!');
    e.preventDefault();
    router.push('/forensics');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900 text-white">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6"
            >
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-purple-400 font-medium">
                Open Source AI Project
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Stop Misinformation
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Before It Spreads
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              VeriHub's advanced AI detects fake news and misinformation directly in your
              browser, protecting you from false claims in real-time. Join thousands who
              trust VeriHub to keep them informed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {/* Download Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/download"
                  className="inline-flex items-center justify-center space-x-2 text-lg px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  <Download className="h-5 w-5" />
                  <span>Download Extension Free</span>
                </Link>
              </motion.div>

              {/* Forensics Button - Multiple Test Methods */}
              
              {/* Method 1: Regular Link */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/forensics"
                  className="inline-flex items-center justify-center space-x-2 text-lg px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  <Shield className="h-5 w-5" />
                  <span>Explore Forensics (Link)</span>
                </Link>
              </motion.div>

              {/* Method 2: useRouter with onClick */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleForensicsClick}
                className="inline-flex items-center justify-center space-x-2 text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300"
              >
                <Shield className="h-5 w-5" />
                <span>Forensics (Router)</span>
              </motion.button>

              {/* Method 3: Simple window.location */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log('Window location navigation');
                  window.location.href = '/forensics';
                }}
                className="inline-flex items-center justify-center space-x-2 text-lg px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all duration-300"
              >
                <Shield className="h-5 w-5" />
                <span>Forensics (Window)</span>
              </motion.button>
            </div>

            {/* Debug Info */}
            <div className="mt-8 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-bold mb-2">Debug Info:</h3>
              <p className="text-sm text-gray-300">Current URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
              <p className="text-sm text-gray-300">Click any button above and check browser console</p>
            </div>

            <div className="flex items-center justify-center lg:justify-start space-x-6 mt-8">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Shield className="h-4 w-4 text-green-500" />
                <span>100% Privacy</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Real-time Detection</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Eye className="h-4 w-4 text-cyan-500" />
                <span>0 Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}