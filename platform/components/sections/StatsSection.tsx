'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Shield, Users, Target, Clock } from 'lucide-react';

const stats = [
  {
    icon: Target,
    label: 'Detection Accuracy',
    value: 94.7,
    suffix: '%',
    description: 'AI accuracy in identifying misinformation',
    color: 'text-veri-success',
  },
  {
    icon: Clock,
    label: 'Analysis Speed',
    value: 1.3,
    suffix: 's',
    description: 'Average time to analyze content',
    color: 'text-veri-warning',
  },
  {
    icon: Shield,
    label: 'Sources Verified',
    value: 15000,
    suffix: '+',
    description: 'Trusted sources in our database',
    color: 'text-veri-purple',
  },
  {
    icon: Users,
    label: 'Active Users',
    value: 2500,
    suffix: '+',
    description: 'People protected by VeriHub',
    color: 'text-veri-teal',
  },
];

export function StatsSection() {
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
            Trusted by <span className="gradient-text">Thousands</span>
          </motion.h2>
          <motion.p 
            className="text-xl text-veri-gray-light max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Real-world performance metrics that demonstrate VeriHub's effectiveness
            in the fight against misinformation.
          </motion.p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <AnimatedSection key={stat.label} delay={index * 0.1}>
              <StatCard {...stat} />
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.4} className="text-center mt-16">
          <motion.div 
            className="bg-dark-surface-2/80 backdrop-blur-sm rounded-2xl p-8 border border-veri-purple/20 hover:border-veri-purple/40 transition-all duration-300"
            whileHover={{ 
              y: -4,
              boxShadow: "0 20px 40px -10px rgba(139, 92, 246, 0.2)"
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              Real-time Protection
            </h3>
            <p className="text-veri-gray-light mb-6 max-w-2xl mx-auto">
              Every day, VeriHub prevents thousands of pieces of misinformation from
              spreading, protecting users and promoting digital literacy.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-veri-gray">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-veri-success rounded-full animate-pulse" />
                <span>Active Monitoring</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-veri-purple" />
                <span>Privacy Protected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-veri-teal rounded-full animate-pulse" />
                <span>Continuously Learning</span>
              </div>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value, suffix, description, color }: any) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / 50;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(parseFloat(start.toFixed(1)));
      }
    }, 20);

    return () => clearInterval(timer);
  }, [value]);

  return (
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
        className={`${color} bg-current/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-current/20 transition-colors`}
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className={`h-8 w-8 ${color}`} />
      </motion.div>
      
      <motion.div
        className="text-3xl md:text-4xl font-bold text-white mb-3 gradient-text"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.3 }}
      >
        {typeof value === 'number' && value > 1000 
          ? `${(displayValue / 1000).toFixed(0)}k`
          : displayValue.toFixed(value % 1 === 0 ? 0 : 1)
        }{suffix}
      </motion.div>
      
      <h3 className="text-lg font-semibold text-white mb-3">{label}</h3>
      
      <p className="text-veri-gray-light leading-relaxed">{description}</p>
    </motion.div>
  );
}