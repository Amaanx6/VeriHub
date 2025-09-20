'use client';

import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, ToggleLeft as Toggle, AlertTriangle } from 'lucide-react';

interface DemoControlsProps {
  selectedDemo: number;
  onDemoChange: (index: number) => void;
  extensionEnabled: boolean;
  onExtensionToggle: (enabled: boolean) => void; // Updated to accept boolean parameter
  isPlaying: boolean;
  onPlayToggle: () => void;
  demoArticles: any[];
}

export function DemoControls({
  selectedDemo,
  onDemoChange,
  extensionEnabled,
  onExtensionToggle,
  isPlaying,
  onPlayToggle,
  demoArticles,
}: DemoControlsProps) {
  const handleToggle = () => {
    onExtensionToggle(!extensionEnabled);
  };

  return (
    <div className="bg-dark-surface border border-veri-purple/20 rounded-xl p-6">
      {/* Demo Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Choose Demo Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoArticles.map((demo, index) => (
            <motion.button
              key={demo.id}
              onClick={() => onDemoChange(index)}
              className={`p-4 rounded-lg border transition-all text-left ${
                selectedDemo === index
                  ? 'bg-veri-purple/20 border-veri-purple text-white'
                  : 'bg-dark-surface-2 border-veri-gray/20 text-veri-gray-light hover:border-veri-purple/50 hover:text-white'
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">{demo.title}</span>
              </div>
              <p className="text-sm opacity-80">
                {demo.category} misinformation example
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Extension Toggle */}
        <motion.button
          onClick={handleToggle}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            extensionEnabled
              ? 'bg-veri-success/20 text-veri-success border border-veri-success/20 hover:bg-veri-success/30'
              : 'bg-veri-gray/20 text-veri-gray border border-veri-gray/20 hover:bg-veri-gray/30'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Toggle className="h-4 w-4" />
          <span>Extension {extensionEnabled ? 'ON' : 'OFF'}</span>
        </motion.button>

        {/* Demo Status */}
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            extensionEnabled ? 'bg-veri-success animate-pulse' : 'bg-veri-gray'
          }`} />
          <span className="text-veri-gray-light">
            {extensionEnabled ? 'Protected' : 'Unprotected'}
          </span>
        </div>

        {/* Instructions */}
        <div className="flex-1 text-right">
          <p className="text-sm text-veri-gray-light">
            Toggle extension to see before/after • Click highlighted text for details
          </p>
        </div>
      </div>
    </div>
  );
}