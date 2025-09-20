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

  const domain = pageUrl ? new URL(pageUrl).hostname : 'UNKNOWN';

  return (
    <div className="w-[450px] h-[600px] flex flex-col bg-black border-4 border-red-500 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Header */}
      <div className="bg-white text-black p-6 border-b-4 border-red-500">
        <div className="w-12 h-12 bg-red-500 text-white flex items-center justify-center font-black text-xl transform -skew-x-12 mx-auto mb-4">
          V
        </div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-center mb-4">VERIHUB FACT CHECKER</h1>
        <p className="font-black uppercase tracking-wide text-center">NEW PAGE DETECTED</p>
      </div>

      {/* Page Info */}
      <div className="flex-1 p-6 flex flex-col justify-center bg-black">
        <div className="bg-gray-800 p-4 mb-8 border-4 border-white">
          <h3 className="font-black text-white uppercase tracking-wide mb-4 leading-tight">
            {pageTitle || 'UNTITLED PAGE'}
          </h3>
          <p className="text-red-400 font-bold uppercase tracking-wide text-sm">{domain}</p>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-lg font-black text-white uppercase tracking-wider mb-6">
            CHECK FOR MISINFORMATION?
          </h2>
          <p className="text-white font-bold uppercase tracking-wide leading-relaxed">
            ANALYZE THIS PAGE FOR FALSE CLAIMS, MISLEADING INFORMATION, AND FACTUAL ERRORS USING AI FACT-CHECKING.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full bg-red-500 text-white py-6 px-8 border-4 border-white font-black text-lg uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {analyzing ? 'STARTING ANALYSIS...' : 'CHECK FOR FALSE CLAIMS'}
          </button>
          
          <button
            onClick={onDismiss}
            disabled={analyzing}
            className="w-full bg-gray-800 text-white py-6 px-8 border-4 border-white font-black text-lg uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            NOT NOW
          </button>
        </div>

        {analyzing && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center bg-red-500 text-white p-4 border-4 border-white">
              <div className="w-4 h-4 bg-white animate-pulse mr-4"></div>
              <span className="font-black uppercase tracking-wide">SETTING UP ANALYSIS...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 text-center border-t-4 border-red-500 bg-white">
        <p className="text-black font-black uppercase tracking-wide text-xs">
          RESULTS WILL APPEAR BELOW WITH HIGHLIGHTED FALSE CLAIMS
        </p>
      </div>
    </div>
  );
};