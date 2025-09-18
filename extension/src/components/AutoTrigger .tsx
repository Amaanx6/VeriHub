import { useState } from 'react';

interface AutoTriggerProps {
  onTriggerAnalysis: () => void;
  onDismiss: () => void;
  pageTitle?: string;
  pageUrl?: string;
}

export const AutoTrigger = ({ onTriggerAnalysis, onDismiss, pageTitle, pageUrl }: AutoTriggerProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  
  const handleAnalyze = () => {
    setAnalyzing(true);
    onTriggerAnalysis();
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      onDismiss();
    }, 3000);
  };

  const domain = pageUrl ? new URL(pageUrl).hostname : 'Unknown';

  return (
    <div className="w-[450px] h-[600px] flex flex-col bg-gradient-to-br from-blue-50 to-red-50">
      {/* Header */}
      <div className="p-6 text-center border-b bg-white">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-white font-bold">V</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">VeriHub Fact Checker</h1>
        <p className="text-sm text-gray-600">New page detected</p>
      </div>

      {/* Page Info */}
      <div className="flex-1 p-6 flex flex-col justify-center">
        <div className="bg-white rounded-lg p-4 mb-6 border shadow-sm">
          <h3 className="font-medium text-gray-800 mb-2 leading-tight">
            {pageTitle || 'Untitled Page'}
          </h3>
          <p className="text-sm text-blue-600 font-mono">{domain}</p>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Check for Misinformation?
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Analyze this page for false claims, misleading information, and factual errors using AI fact-checking.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {analyzing ? 'Starting Analysis...' : 'Check for False Claims'}
          </button>
          
          <button
            onClick={onDismiss}
            disabled={analyzing}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Not Now
          </button>
        </div>

        {analyzing && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-sm text-blue-600">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              Setting up analysis...
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 text-center border-t bg-gray-50">
        <p className="text-xs text-gray-500">
          Results will appear below with highlighted false claims
        </p>
      </div>
    </div>
  );
};