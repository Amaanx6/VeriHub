'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ExternalLink, MessageCircle, X, Flag } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface HighlightTooltipProps {
  highlight: any;
  position: { x: number; y: number };
  onClose: () => void;
}

export function HighlightTooltip({ highlight, position, onClose }: HighlightTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (highlight) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [highlight, onClose]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-veri-danger/10',
          border: 'border-veri-danger/30',
          text: 'text-veri-danger',
          icon: 'text-veri-danger',
        };
      case 'medium':
        return {
          bg: 'bg-veri-warning/10',
          border: 'border-veri-warning/30',
          text: 'text-veri-warning',
          icon: 'text-veri-warning',
        };
      case 'low':
        return {
          bg: 'bg-veri-success/10',
          border: 'border-veri-success/30',
          text: 'text-veri-success',
          icon: 'text-veri-success',
        };
      default:
        return {
          bg: 'bg-veri-gray/10',
          border: 'border-veri-gray/30',
          text: 'text-veri-gray',
          icon: 'text-veri-gray',
        };
    }
  };

  return (
    <AnimatePresence>
      {highlight && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-50 w-96 max-w-[90vw]"
            style={{
              left: Math.max(10, Math.min(position.x - 192, window.innerWidth - 400)),
              top: Math.max(10, position.y - 200),
            }}
          >
            <div className={`verihub-tooltip ${getSeverityColor(highlight.severity).bg} ${getSeverityColor(highlight.severity).border}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1">
                  <AlertTriangle className={`h-5 w-5 ${getSeverityColor(highlight.severity).icon} flex-shrink-0 mt-1`} />
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-1">
                      Misinformation Detected
                    </h3>
                    <div className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      highlight.severity === 'high' ? 'bg-veri-danger/20 text-veri-danger' :
                      highlight.severity === 'medium' ? 'bg-veri-warning/20 text-veri-warning' :
                      'bg-veri-success/20 text-veri-success'
                    }`}>
                      {highlight.severity.toUpperCase()} RISK
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-veri-gray hover:text-white transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Highlighted Text */}
              <div className="mb-4 p-3 bg-dark-surface-3 rounded-lg border border-veri-gray/20">
                <p className="text-white font-medium text-sm">
                  "{highlight.text}"
                </p>
              </div>

              {/* Analysis */}
              <div className="mb-6">
                <h4 className="text-white font-medium mb-2">Why this is flagged:</h4>
                <p className="text-veri-gray-light text-sm leading-relaxed">
                  {highlight.reason}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary text-xs px-3 py-2 flex items-center space-x-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View Sources</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-secondary text-xs px-3 py-2 flex items-center space-x-2"
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>Ask AI</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-secondary text-xs px-3 py-2 flex items-center space-x-2"
                >
                  <Flag className="h-3 w-3" />
                  <span>Report</span>
                </motion.button>
              </div>

              {/* Confidence Score */}
              <div className="mt-4 pt-4 border-t border-veri-purple/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-veri-gray-light">Confidence Score:</span>
                  <span className="text-white font-medium">
                    {Math.floor(Math.random() * 10 + 85)}%
                  </span>
                </div>
              </div>

              {/* Arrow pointing to highlighted text */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-dark-surface-2 border-r border-b border-veri-purple/30 rotate-45" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}