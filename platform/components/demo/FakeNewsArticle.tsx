'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, AlertTriangle, Shield, MessageCircle, Flag, ExternalLink } from 'lucide-react';
import { HighlightTooltip } from './HighlightTooltip';

interface FakeNewsArticleProps {
  article: any;
  extensionEnabled: boolean;
  isPlaying: boolean;
}

export function FakeNewsArticle({ article, extensionEnabled, isPlaying }: FakeNewsArticleProps) {
  const [selectedHighlight, setSelectedHighlight] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleHighlightClick = (highlight: any, event: React.MouseEvent) => {
    if (!extensionEnabled) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setSelectedHighlight(highlight);
  };

  const renderContentWithHighlights = (content: string) => {
    if (!extensionEnabled) {
      return content;
    }

    let processedContent = content;
    const highlights = article.article.highlights;

    // Sort highlights by text length (longest first) to avoid partial replacements
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);

    sortedHighlights.forEach((highlight, index) => {
      const highlightClass = `highlight-${highlight.severity}`;
      const replacement = `<span class="${highlightClass} cursor-pointer hover:scale-105 transition-transform" data-highlight-index="${index}">${highlight.text}</span>`;
      processedContent = processedContent.replace(
        new RegExp(highlight.text, 'gi'),
        replacement
      );
    });

    return processedContent;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-veri-danger" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-veri-warning" />;
      case 'low':
        return <Shield className="h-4 w-4 text-veri-success" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-veri-gray" />;
    }
  };

  return (
    <div className="relative">
      {/* Browser Window */}
      <div className="bg-dark-surface-2 rounded-lg border border-veri-purple/20 shadow-2xl">
        {/* Browser Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-veri-purple/20 bg-dark-surface rounded-t-lg">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-veri-danger rounded-full" />
            <div className="w-3 h-3 bg-veri-warning rounded-full" />
            <div className="w-3 h-3 bg-veri-success rounded-full" />
          </div>
          
          <div className="flex-1 mx-4">
            <div className="bg-dark-surface-3 rounded-md px-3 py-1 border border-veri-gray/20">
              <span className="text-sm text-veri-gray-light">
                https://{article.url}
              </span>
            </div>
          </div>

          {/* VeriHub Extension Status */}
          <AnimatePresence>
            {extensionEnabled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-2 bg-veri-purple/20 rounded-md px-2 py-1"
              >
                <Shield className="h-4 w-4 text-veri-purple" />
                <span className="text-xs text-veri-purple font-medium">VeriHub</span>
                <div className="w-2 h-2 bg-veri-success rounded-full animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Article Content */}
        <div className="p-6 bg-white text-gray-900 min-h-[600px]">
          {/* Article Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4 text-gray-900">
              {article.article.headline}
            </h1>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>By {article.article.author}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{article.article.date}</span>
              </div>
            </div>
          </div>

          {/* Article Content with Highlighting */}
          <div className="prose max-w-none">
            {article.article.content.split('\n').map((paragraph: string, index: number) => {
              if (paragraph.trim() === '') return null;
              
              return (
                <motion.p
                  key={index}
                  className="mb-4 text-gray-800 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  dangerouslySetInnerHTML={{
                    __html: renderContentWithHighlights(paragraph),
                  }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.hasAttribute('data-highlight-index')) {
                      const highlightIndex = parseInt(target.getAttribute('data-highlight-index') || '0');
                      const highlight = article.article.highlights[highlightIndex];
                      handleHighlightClick(highlight, e);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* VeriHub Overlay (when extension is enabled) */}
        <AnimatePresence>
          {extensionEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-4 right-4 bg-dark-surface/95 backdrop-blur-md border border-veri-purple/30 rounded-lg p-4 max-w-sm"
            >
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-5 w-5 text-veri-purple" />
                <span className="font-semibold text-white">VeriHub Analysis</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-veri-gray-light">Threats Detected:</span>
                  <span className="text-veri-danger font-medium">
                    {article.article.highlights.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-veri-gray-light">Analysis Time:</span>
                  <span className="text-veri-success font-medium">1.2s</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-veri-gray-light">Confidence:</span>
                  <span className="text-veri-purple font-medium">94.7%</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-veri-purple/20">
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-secondary text-xs px-3 py-1 flex items-center space-x-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>Ask AI</span>
                  </button>
                  <button className="btn-secondary text-xs px-3 py-1 flex items-center space-x-1">
                    <Flag className="h-3 w-3" />
                    <span>Report</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tooltip */}
      <HighlightTooltip
        highlight={selectedHighlight}
        position={tooltipPosition}
        onClose={() => setSelectedHighlight(null)}
      />

      {/* Summary Panel */}
      {extensionEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-dark-surface border border-veri-purple/20 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-veri-warning" />
            <span>Misinformation Analysis Summary</span>
          </h3>
          
          <div className="space-y-3">
            {article.article.highlights.map((highlight: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-dark-surface-2 rounded-lg border border-veri-gray/20"
              >
                {getSeverityIcon(highlight.severity)}
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">
                    "{highlight.text}"
                  </p>
                  <p className="text-sm text-veri-gray-light">
                    {highlight.reason}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  highlight.severity === 'high' ? 'bg-veri-danger/20 text-veri-danger' :
                  highlight.severity === 'medium' ? 'bg-veri-warning/20 text-veri-warning' :
                  'bg-veri-success/20 text-veri-success'
                }`}>
                  {highlight.severity.toUpperCase()}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}