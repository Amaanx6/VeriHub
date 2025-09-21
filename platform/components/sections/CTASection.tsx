'use client';

import { motion } from 'framer-motion';
import { Download, Play, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-veri-gradient opacity-10" />
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-veri-purple/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Ready to Fight
            <br />
            <span className="gradient-text glow-text">Misinformation?</span>
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <p className="text-xl text-veri-gray-light mb-12 max-w-2xl mx-auto">
            Join thousands of users who trust VeriHub to protect them from fake news.
            Download our free browser extension and experience the power of AI-driven
            fact-checking in real-time.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/download"
                className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"
              >
                <Download className="h-5 w-5" />
                <span>Download Free Extension</span>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/demo"
                className="btn-secondary flex items-center space-x-2 text-lg px-8 py-4"
              >
                <Play className="h-5 w-5" />
                <span>See Interactive Demo</span>
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold gradient-text">2 seconds</div>
              <p className="text-veri-gray-light">Average detection time</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold gradient-text">15,000+</div>
              <p className="text-veri-gray-light">Sources verified</p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold gradient-text">94.7%</div>
              <p className="text-veri-gray-light">Detection accuracy</p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.4}>
          <div className="mt-12 p-6 bg-veri-gradient-subtle rounded-2xl border border-veri-purple/20">
            <h3 className="text-lg font-semibold text-white mb-2">
              🔓 Completely Free & Open Source
            </h3>
            <p className="text-veri-gray-light">
              VeriHub is an open-source project committed to digital literacy and
              fighting misinformation. No subscriptions, no tracking, just protection.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}