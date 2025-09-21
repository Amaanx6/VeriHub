'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, Shield, Zap, Eye, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// AnimatedSection component (since import might be missing)
interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ 
  children, 
  delay = 0, 
  direction = 'up' 
}) => {
  const directions: Record<'up' | 'down' | 'left' | 'right', { opacity: number; x?: number; y?: number }> = {
    up: { opacity: 0, y: 20 },
    down: { opacity: 0, y: -20 },
    left: { opacity: 0, x: 20 },
    right: { opacity: 0, x: -20 }
  };

  return (
    <motion.div
      initial={directions[direction]}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
};

// Simple BrowserMockup component (since import might be missing)
const BrowserMockup = () => (
  <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
    <div className="flex items-center space-x-2 bg-gray-900 px-4 py-3 border-b border-gray-700">
      <div className="w-3 h-3 rounded-full bg-red-500"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
      <div className="w-3 h-3 rounded-full bg-green-500"></div>
      <div className="flex-1 bg-gray-700 rounded px-3 py-1 ml-4">
        <div className="text-xs text-gray-400">verihub.com</div>
      </div>
    </div>
    <div className="p-6 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20 h-64 flex items-center justify-center">
      <div className="text-center">
        <Shield className="h-16 w-16 text-purple-500 mx-auto mb-4" />
        <div className="text-white font-semibold">VeriHub AI Detection</div>
        <div className="text-gray-400 text-sm mt-2">Real-time misinformation protection</div>
      </div>
    </div>
  </div>
);

export function Hero() {
  const router = useRouter();

  const handleForensicsClick = () => {
    console.log('Forensics navigation triggered');
    router.push('/forensics');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent"></div>
        </div>
      </div>

      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <AnimatedSection>
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
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Stop Misinformation
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Before It Spreads
                </span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl">
                VeriHub's advanced AI detects fake news and misinformation directly in your
                browser, protecting you from false claims in real-time. Join thousands who
                trust VeriHub to keep them informed.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {/* Download Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/download"
                    className="inline-flex items-center justify-center space-x-2 text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download Extension Free</span>
                  </Link>
                </motion.div>

                {/* Forensics Button - Fixed with multiple approaches */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/forensics"
                    onClick={(e) => {
                      console.log('Link clicked directly');
                      // Let the Link handle navigation naturally
                    }}
                    className="inline-flex items-center justify-center space-x-2 text-lg px-8 py-4 bg-gray-700/50 hover:bg-gray-600/50 text-white border border-gray-600/50 hover:border-purple-500/50 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg"
                  >
                    <Shield className="h-5 w-5" />
                    <span>Explore Forensics</span>
                  </Link>
                </motion.div>

                {/* Backup Button with useRouter */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleForensicsClick}
                  className="inline-flex items-center justify-center space-x-2 text-lg px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg"
                >
                  <Shield className="h-5 w-5" />
                  <span>Forensics (Alt)</span>
                </motion.button>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
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
            </AnimatedSection>
          </div>

          {/* Right Column - Browser Mockup */}
          <AnimatedSection delay={0.5} direction="right">
            <div className="relative">
              <BrowserMockup />
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-purple-500/50 rounded-full relative">
          <motion.div
            className="w-1 h-2 bg-purple-500 rounded-full absolute left-1/2 top-2 transform -translate-x-1/2"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}