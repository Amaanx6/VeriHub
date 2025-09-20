'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Eye, MessageCircle } from 'lucide-react';

export function BrowserMockup() {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  const demos = [
    {
      title: 'Health Misinformation Detected',
      url: 'healthnews.com/miracle-cure',
      highlight: 'This "miracle cure" has not been proven by scientific studies',
      severity: 'high',
    },
    {
      title: 'Political Claim Verified',
      url: 'politicalnews.com/election-stats',
      highlight: 'These statistics appear to be accurate according to official sources',
      severity: 'low',
    },
    {
      title: 'Technology Rumor Flagged',
      url: 'technews.com/breakthrough',
      highlight: 'This technology claim lacks credible sources',
      severity: 'medium',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demos.length);
      setShowTooltip(false);
    }, 4000);

    const tooltipTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(tooltipTimer);
    };
  }, [currentDemo, demos.length]);

  const currentDemoData = demos[currentDemo];
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-veri-danger bg-veri-danger/10 text-veri-danger';
      case 'medium':
        return 'border-veri-warning bg-veri-warning/10 text-veri-warning';
      case 'low':
        return 'border-veri-success bg-veri-success/10 text-veri-success';
      default:
        return 'border-veri-gray bg-veri-gray/10 text-veri-gray';
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto">
      {/* Browser Window */}
      <motion.div
        className="bg-dark-surface-2 rounded-lg shadow-2xl border border-veri-purple/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Browser Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-veri-purple/20">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-veri-danger rounded-full" />
            <div className="w-3 h-3 bg-veri-warning rounded-full" />
            <div className="w-3 h-3 bg-veri-success rounded-full" />
          </div>
          
          {/* URL Bar */}
          <div className="flex-1 mx-4">
            <div className="bg-dark-surface rounded-md px-3 py-1 border border-veri-purple/20">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentDemo}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-veri-gray-light"
                >
                  https://{currentDemoData.url}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* VeriHub Extension Icon */}
          <motion.div
            className="flex items-center space-x-2 bg-veri-purple/20 rounded-md px-2 py-1"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="h-4 w-4 text-veri-purple" />
            <span className="text-xs text-veri-purple font-medium">VeriHub</span>
          </motion.div>
        </div>

        {/* Page Content */}
        <div className="p-6 min-h-[400px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDemo}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl font-bold mb-4 text-white">
                {currentDemoData.title}
              </h1>
              
              <div className="space-y-4 text-veri-gray-light">
                <p>
                  Breaking news about health, politics, and technology continues to spread
                  across social media platforms...
                </p>
                
                {/* Highlighted Misinformation */}
                <motion.div
                  className={`p-4 rounded-lg border-l-4 relative ${getSeverityColor(currentDemoData.severity)}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="relative">
                    {currentDemoData.highlight}
                    {showTooltip && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-full left-0 mt-2 w-80 verihub-tooltip z-10"
                      >
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-veri-warning flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-2">
                              Misinformation Detected
                            </h3>
                            <p className="text-sm text-veri-gray-light mb-3">
                              This claim lacks credible sources and may be misleading.
                            </p>
                            <div className="flex space-x-2">
                              <button className="btn-primary text-xs px-3 py-1">
                                View Sources
                              </button>
                              <button className="btn-secondary text-xs px-3 py-1 flex items-center space-x-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>Ask AI</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </p>
                </motion.div>
                
                <p>
                  According to recent studies and expert analysis, the information requires
                  careful verification before sharing...
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Floating VeriHub Interface */}
          <motion.div
            className="absolute top-4 right-4 bg-dark-surface border border-veri-purple/30 rounded-lg p-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-veri-purple" />
              <span className="text-xs font-medium text-white">VeriHub Active</span>
            </div>
            <div className="text-xs text-veri-gray-light">
              <div className="flex items-center justify-between mb-1">
                <span>Scanning content...</span>
                <motion.div
                  className="w-2 h-2 bg-veri-success rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
              <div className="text-veri-success">✓ Analysis complete</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Demo Navigation Dots */}
      <div className="flex justify-center space-x-2 mt-6">
        {demos.map((_, index) => (
          <motion.button
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentDemo ? 'bg-veri-purple' : 'bg-veri-gray'
            }`}
            whileHover={{ scale: 1.2 }}
            onClick={() => setCurrentDemo(index)}
          />
        ))}
      </div>
    </div>
  );
}