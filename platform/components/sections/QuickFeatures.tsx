'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, MessageCircle, Flag, Eye, Brain } from 'lucide-react';
import Link from 'next/link';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

const features = [
  {
    icon: Shield,
    title: 'Real-time Verification',
    description: 'AI analyzes content instantly as you browse, detecting misinformation in under 2 seconds.',
    color: 'text-veri-purple',
    bgColor: 'bg-veri-purple/10',
    borderColor: 'border-veri-purple/20',
  },
  {
    icon: Eye,
    title: 'Smart Highlighting',
    description: 'Suspicious content is highlighted with color-coded severity levels and detailed explanations.',
    color: 'text-veri-orange',
    bgColor: 'bg-veri-orange/10',
    borderColor: 'border-veri-orange/20',
  },
  {
    icon: MessageCircle,
    title: 'AI Chatbot Assistant',
    description: 'Ask questions about any content and get instant fact-checking responses from our AI.',
    color: 'text-veri-teal',
    bgColor: 'bg-veri-teal/10',
    borderColor: 'border-veri-teal/20',
  },
  {
    icon: Flag,
    title: 'One-Click Reporting',
    description: 'Report misinformation to help improve our database and protect other users.',
    color: 'text-veri-warning',
    bgColor: 'bg-veri-warning/10',
    borderColor: 'border-veri-warning/20',
  },
  {
    icon: Brain,
    title: 'Source Credibility',
    description: 'Analyze domain trust scores and source reliability with comprehensive assessments.',
    color: 'text-veri-success',
    bgColor: 'bg-veri-success/10',
    borderColor: 'border-veri-success/20',
  },
  {
    icon: Zap,
    title: 'Advanced Detection',
    description: 'Machine learning algorithms continuously improve accuracy and detect new patterns.',
    color: 'text-veri-purple',
    bgColor: 'bg-veri-purple/10',
    borderColor: 'border-veri-purple/20',
  },
];

export function QuickFeatures() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Effects - Matching Hero */}
      <div className="absolute inset-0 bg-cyber-glow opacity-30" />
      <div className="absolute inset-0 bg-veri-gradient-subtle" />
      
      {/* Animated background particles - Matching Hero */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-veri-purple/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Powerful <span className="gradient-text">AI Protection</span>
          </motion.h2>
          <motion.p 
            className="text-xl text-veri-gray-light max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            VeriHub combines cutting-edge artificial intelligence with real-time analysis
            to give you comprehensive protection against misinformation.
          </motion.p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <AnimatedSection
              key={feature.title}
              delay={index * 0.1}
            >
              <motion.div
                className={`group p-6 rounded-xl bg-dark-surface-2/80 backdrop-blur-sm border ${feature.borderColor} hover:border-veri-purple/40 transition-all duration-300 h-full`}
                whileHover={{ 
                  y: -4,
                  scale: 1.02,
                  boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.3)"
                }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className={`${feature.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 5 }}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </motion.div>
                
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-veri-gray-light mb-4 leading-relaxed">
                  {feature.description}
                </p>

                <motion.div
                  className={`${feature.color} text-sm font-medium flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  whileHover={{ x: 5 }}
                >
                  <span>Learn more</span>
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </motion.div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.6} className="text-center mt-16">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/features"
              className="btn-primary inline-flex items-center space-x-2 text-lg px-8 py-4"
            >
              <span>Explore All Features</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.div>
            </Link>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
