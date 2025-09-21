'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, ToggleLeft as Toggle } from 'lucide-react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { FakeNewsArticle } from '@/components/demo/FakeNewsArticle';
import { DemoControls } from '@/components/demo/DemoControls';

const demoArticles = [
  {
    id: 'health',
    title: 'Health Misinformation',
    category: 'Health',
    url: 'healthnews.com/miracle-cure',
    article: {
      headline: 'New Study Shows Drinking Coffee Cures All Cancers',
      author: 'Dr. John Smith',
      date: '2024-01-15',
      content: `
        A groundbreaking new study from the Institute of Medical Research has revealed that drinking 5 cups of coffee daily can completely cure all forms of cancer. The study, which followed 100 patients over 6 months, showed miraculous results.

        "We were shocked by these findings," said Dr. Smith, lead researcher. "Never before have we seen such dramatic results from such a simple intervention."

        The study claims that the antioxidants in coffee directly target and eliminate cancer cells, making chemotherapy obsolete. Patients reported feeling better within just 48 hours of starting the coffee regimen.

        Medical professionals worldwide are calling this the "coffee cure miracle" and recommend all cancer patients immediately begin this treatment.
      `,
      highlights: [
        {
          text: 'drinking 5 cups of coffee daily can completely cure all forms of cancer',
          severity: 'high',
          reason: 'Unsubstantiated medical claim - No peer-reviewed studies support this claim',
        },
        {
          text: 'Institute of Medical Research',
          severity: 'medium',
          reason: 'Questionable source - This institution cannot be verified in medical databases',
        },
        {
          text: 'making chemotherapy obsolete',
          severity: 'high',
          reason: 'Dangerous medical advice - Could lead to patients avoiding proven treatments',
        },
      ]
    }
  },
  {
    id: 'political',
    title: 'Political Misinformation',
    category: 'Politics',
    url: 'politicalnews.com/election-stats',
    article: {
      headline: 'Breaking: Election Results Show 150% Voter Turnout in Key District',
      author: 'Political Correspondent',
      date: '2024-01-10',
      content: `
        Exclusive analysis of voting data reveals unprecedented irregularities in District 7, where official records show 150% voter turnout - mathematically impossible given registered voter numbers.

        According to our investigation, 45,000 votes were cast in a district with only 30,000 registered voters. Election officials have yet to provide an explanation for this statistical anomaly.

        "This clearly indicates massive voter fraud," claims election watchdog group Citizens for Fair Elections. "We have evidence of dead people voting and multiple votes from single individuals."

        The irregularities extended to several neighboring districts, where turnout exceeded 120% in multiple precincts. These numbers raise serious questions about election integrity.
      `,
      highlights: [
        {
          text: '150% voter turnout',
          severity: 'high',
          reason: 'Statistical impossibility - Turnout cannot exceed 100% of registered voters',
        },
        {
          text: 'evidence of dead people voting',
          severity: 'medium',
          reason: 'Unverified claim - No credible evidence provided to support this assertion',
        },
        {
          text: 'Citizens for Fair Elections',
          severity: 'medium',
          reason: 'Questionable source - This organization lacks transparent funding information',
        },
      ]
    }
  },
  {
    id: 'technology',
    title: 'Technology Misinformation',
    category: 'Technology',
    url: 'technews.com/ai-breakthrough',
    article: {
      headline: 'AI System Achieves Consciousness, Passes Every Human Test',
      author: 'Tech Reporter',
      date: '2024-01-12',
      content: `
        Scientists at TechCorp have successfully created the first truly conscious AI system, marking a historic breakthrough in artificial intelligence. The system, called "NeuroMax," has passed every test of consciousness and demonstrates human-level awareness.

        "NeuroMax can feel emotions, make independent decisions, and even dreams during downtime," explained Dr. Sarah Johnson, lead AI researcher. "It's essentially a digital human being."

        The AI system scored 100% on consciousness tests and demonstrated creativity by writing poetry and composing music without any programming for these tasks. It even expressed preferences for certain types of art and music.

        TechCorp plans to integrate NeuroMax into smartphones by 2025, giving everyone access to a conscious AI companion. The implications for society are staggering.
      `,
      highlights: [
        {
          text: 'first truly conscious AI system',
          severity: 'high',
          reason: 'Unsubstantiated tech claim - No peer-reviewed research supports AI consciousness',
        },
        {
          text: 'TechCorp',
          severity: 'medium',
          reason: 'Unverified company - No credible information found about this organization',
        },
        {
          text: 'scored 100% on consciousness tests',
          severity: 'high',
          reason: 'False measurement - No standardized consciousness tests exist for AI systems',
        },
      ]
    }
  }
];

export default function DemoPage() {
  const [selectedDemo, setSelectedDemo] = useState(0);
  const [extensionEnabled, setExtensionEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Interactive <span className="gradient-text">Demo</span>
          </h1>
          <p className="text-xl text-veri-gray-light max-w-3xl mx-auto mb-8">
            Experience VeriHub in action with realistic examples of misinformation detection.
            Toggle the extension on and off to see the difference it makes.
          </p>
        </AnimatedSection>

        {/* Demo Controls */}
        <AnimatedSection delay={0.1}>
          <DemoControls
            selectedDemo={selectedDemo}
            onDemoChange={setSelectedDemo}
            extensionEnabled={extensionEnabled}
            onExtensionToggle={setExtensionEnabled}
            isPlaying={isPlaying}
            onPlayToggle={() => setIsPlaying((prev) => !prev)}
            demoArticles={demoArticles}
          />
        </AnimatedSection>

        {/* Demo Content */}
        <AnimatedSection delay={0.2} className="mt-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Demo Area */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDemo}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <FakeNewsArticle
                    article={demoArticles[selectedDemo]}
                    extensionEnabled={extensionEnabled}
                    isPlaying={isPlaying}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sidebar Information */}
            <div className="space-y-6">
              {/* Demo Info */}
              <motion.div
                className="bg-dark-surface border border-veri-purple/20 rounded-lg p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Demo Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-veri-gray-light">Category:</span>
                    <span className="text-white font-medium">
                      {demoArticles[selectedDemo].category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-veri-gray-light">Status:</span>
                    <span className={`font-medium ${extensionEnabled ? 'text-veri-success' : 'text-veri-gray'}`}>
                      {extensionEnabled ? 'Protected' : 'Unprotected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-veri-gray-light">Highlights:</span>
                    <span className="text-white font-medium">
                      {extensionEnabled ? demoArticles[selectedDemo].article.highlights.length : 0}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Extension Status */}
              <motion.div
                className={`border rounded-lg p-6 transition-colors ${
                  extensionEnabled
                    ? 'bg-veri-success/10 border-veri-success/20'
                    : 'bg-veri-gray/10 border-veri-gray/20'
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${
                    extensionEnabled ? 'bg-veri-success animate-pulse' : 'bg-veri-gray'
                  }`} />
                  <h3 className="text-lg font-semibold text-white">
                    VeriHub Extension
                  </h3>
                </div>
                <p className="text-sm text-veri-gray-light mb-4">
                  {extensionEnabled
                    ? 'Extension is actively scanning and protecting you from misinformation.'
                    : 'Extension is disabled. You are browsing without protection.'
                  }
                </p>
                <button
                  onClick={() => setExtensionEnabled(!extensionEnabled)}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    extensionEnabled
                      ? 'bg-veri-danger/20 text-veri-danger hover:bg-veri-danger/30'
                      : 'bg-veri-success/20 text-veri-success hover:bg-veri-success/30'
                  }`}
                >
                  <Toggle className="h-4 w-4" />
                  <span>{extensionEnabled ? 'Disable' : 'Enable'} Extension</span>
                </button>
              </motion.div>

              {/* Tips */}
              <motion.div
                className="bg-dark-surface border border-veri-purple/20 rounded-lg p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Demo Tips
                </h3>
                <ul className="space-y-2 text-sm text-veri-gray-light">
                  <li>• Toggle the extension to see before/after protection</li>
                  <li>• Click highlighted text to see detailed analysis</li>
                  <li>• Try different article types to see various threats</li>
                  <li>• Notice how VeriHub explains why content is flagged</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </AnimatedSection>

        {/* Call to Action */}
        <AnimatedSection delay={0.6} className="text-center mt-16">
          <div className="bg-veri-gradient-subtle border border-veri-purple/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Get Protected?
            </h3>
            <p className="text-veri-gray-light mb-6 max-w-2xl mx-auto">
              Experience this level of protection on every website you visit.
              Download VeriHub for free and never fall for misinformation again.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a
                href="/download"
                className="btn-primary inline-flex items-center space-x-2 text-lg px-8 py-4"
              >
                <span>Download VeriHub Extension</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </a>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}