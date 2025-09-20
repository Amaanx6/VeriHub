'use client';

import { Hero } from '@/components/sections/Hero';
import { QuickFeatures } from '@/components/sections/QuickFeatures';
import { StatsSection } from '@/components/sections/StatsSection';
import { TrustIndicators } from '@/components/sections/TrustIndicators';
import { CTASection } from '@/components/sections/CTASection';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <TrustIndicators />
      <QuickFeatures />
      <StatsSection />
      <CTASection />
    </div>
  );
}