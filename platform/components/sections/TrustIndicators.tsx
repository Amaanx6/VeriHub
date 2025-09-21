'use client';

import { motion } from 'framer-motion';
import { Shield, Github, Users, Award } from 'lucide-react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

const indicators = [
  {
    icon: Github,
    title: 'Open Source',
    description: 'Fully transparent code on GitHub',
    value: '100%',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'No tracking, local processing',
    value: '0 Data',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Built by developers, for users',
    value: 'Open',
  },
  // {
  //   icon: Award,
  //   title: 'Hackathon Winner',
  //   description: 'Innovative solution recognized',
  //   value: '2024',
  // },
];

export function TrustIndicators() {
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
          <motion.p 
            className="text-veri-gray-light text-lg mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Trusted by developers and security researchers worldwide
          </motion.p>
        </AnimatedSection>

        {/* Centered grid for 3 cards */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            {indicators.map((indicator, index) => (
              <AnimatedSection key={indicator.title} delay={index * 0.1}>
                <motion.div
                  className="text-center group p-6 rounded-xl bg-dark-surface-2/80 backdrop-blur-sm border border-veri-purple/20 hover:border-veri-purple/40 transition-all duration-300"
                  whileHover={{ 
                    y: -4,
                    scale: 1.02,
                    boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.3)"
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="bg-veri-purple/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-veri-purple/20 transition-colors"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <indicator.icon className="h-8 w-8 text-veri-purple" />
                  </motion.div>
                  
                  <motion.div 
                    className="text-3xl font-bold text-white mb-3 gradient-text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                  >
                    {indicator.value}
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {indicator.title}
                  </h3>
                  
                  <p className="text-veri-gray-light leading-relaxed">
                    {indicator.description}
                  </p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}