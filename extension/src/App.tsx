import { useState } from 'react';
import { DOM } from './components/DOM';
import { Verification } from './components/Verification';

// Simplified type for AI analysis
interface AnalysisData {
  title: string;
  fullContent: string;
  sources: string[];
  pageUrl: string;
  domain: string;
  timestamp: string;
}

function App() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const handleAnalysisReady = (data: AnalysisData) => {
    console.log('📊 App: Clean content ready for AI analysis:', data);
    setAnalysisData(data);
  };

  return (
    <div className="w-[450px] h-[600px] flex flex-col border">
      {/* DOM component takes half the height and scrolls */}
      <div className="flex-1 overflow-auto border-b">
        <DOM onAnalysisReady={handleAnalysisReady} />
      </div>

      {/* Verification component takes remaining space and scrolls */}
      <div className="flex-1 overflow-auto">
        <Verification data={analysisData} />
      </div>
    </div>
  );
}


export default App;