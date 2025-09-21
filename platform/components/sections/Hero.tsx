'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, Shield, Zap, Eye, Download } from 'lucide-react';
import Link from 'next/link';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { BrowserMockup } from '@/components/ui/BrowserMockup';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-cyber-glow opacity-50" />
      <div className="absolute inset-0 bg-veri-gradient-subtle" />

      {/* Animated background particles */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-veri-purple/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              pointerEvents: 'none',
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
                className="inline-flex items-center space-x-2 bg-veri-purple/10 border border-veri-purple/20 rounded-full px-4 py-2 mb-6"
              >
                <Shield className="h-4 w-4 text-veri-purple" />
                <span className="text-sm text-veri-purple font-medium">
                  Open Source AI Project
                </span>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Stop Misinformation
                <br />
                <span className="gradient-text glow-text">Before It Spreads</span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="text-xl text-veri-gray-light mb-8 max-w-2xl">
                VeriHub's advanced AI detects fake news and misinformation directly in your
                browser, protecting you from false claims in real-time. Join thousands who
                trust VeriHub to keep them informed.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/download" className="inline-block">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary flex items-center justify-center space-x-2 text-lg px-8 py-4 cursor-pointer"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download Extension Free</span>
                  </motion.div>
                </Link>

                <Link href="/ledger" className="inline-block">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary flex items-center justify-center space-x-2 text-lg px-8 py-4 cursor-pointer"
                  >
                    <Shield className="h-5 w-5" />
                    <span>Explore Forensics</span>
                  </motion.div>
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <div className="flex items-center justify-center lg:justify-start space-x-6 mt-8">
                <div className="flex items-center space-x-2 text-sm text-veri-gray">
                  <Shield className="h-4 w-4 text-veri-success" />
                  <span>100% Privacy</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-veri-gray">
                  <Zap className="h-4 w-4 text-veri-warning" />
                  <span>Real-time Detection</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-veri-gray">
                  <Eye className="h-4 w-4 text-veri-teal" />
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
        <div className="w-6 h-10 border-2 border-veri-purple/50 rounded-full relative">
          <motion.div
            className="w-1 h-2 bg-veri-purple rounded-full absolute left-1/2 top-2 transform -translate-x-1/2"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}