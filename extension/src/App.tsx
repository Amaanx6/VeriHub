import { useState, useEffect } from 'react';
import { DOM } from './components/DOM';
import { Verification } from './components/Verification';
import { AutoTrigger } from './components/AutoTrigger ';
import ReportForm from './components/ReportForm';

// Simplified type for AI analysis
interface AnalysisData {
  title: string;
  fullContent: string;
  sources: string[];
  pageUrl: string;
  domain: string;
  timestamp: string;
}

interface ReportData {
  url: string;
  title: string;
  flaggedContent: string;
  reason: string;
  correction: string;
  severity: string;
}

function App() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [showAutoTrigger, setShowAutoTrigger] = useState(false);
  const [autoTriggerData, setAutoTriggerData] = useState<{url: string, title: string} | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const handleAnalysisReady = (data: AnalysisData) => {
    console.log('📊 App: Clean content ready for AI analysis:', data);
    setAnalysisData(data);
  };

  // Connect to background script to track popup state
  useEffect(() => {
    let port: chrome.runtime.Port | null = null;
    
    const connectToBackground = () => {
      try {
        if ((window as any).chrome?.runtime) {
          port = chrome.runtime.connect({ name: 'popup' });
          console.log('Connected to background script');
          
          port.onDisconnect.addListener(() => {
            console.log('Disconnected from background script');
          });
        }
      } catch (error) {
        console.log('Not in extension context or connection failed:', error);
      }
    };

    connectToBackground();

    // Cleanup on unmount
    return () => {
      if (port) {
        port.disconnect();
      }
    };
  }, []);

  // Listen for report form messages
  useEffect(() => {
    //@ts-ignore
    const handleMessage = (message: any, sender: any, sendResponse: any) => {
      if (message.type === 'SHOW_REPORT_FORM') {
        console.log('Report form requested with data:', message.reportData);
        setReportData(message.reportData);
        setShowReportForm(true);
        sendResponse({ success: true });
      }
    };

    let cleanupFunction: (() => void) | null = null;

    try {
      if ((window as any).chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener(handleMessage);
        cleanupFunction = () => {
          chrome.runtime.onMessage.removeListener(handleMessage);
        };
      }
    } catch (error) {
      console.log('Not in extension context or listener setup failed:', error);
    }

    return cleanupFunction || (() => {});
  }, []);

  // Check for auto-trigger when component mounts
  useEffect(() => {
    const checkAutoTrigger = async () => {
      try {
        const chromeApi = (window as any).chrome;
        if (!chromeApi?.storage?.local) {
          console.log('Not in extension context');
          return;
        }

        const result = await chromeApi.storage.local.get(['autoTrigger', 'triggerUrl', 'triggerTitle']);
        
        if (result.autoTrigger) {
          setAutoTriggerData({
            url: result.triggerUrl,
            title: result.triggerTitle
          });
          setShowAutoTrigger(true);
          
          // Clear the auto-trigger flag
          await chromeApi.storage.local.remove(['autoTrigger', 'triggerUrl', 'triggerTitle']);
          
          console.log('Auto-trigger detected, showing trigger UI');
        }
      } catch (error) {
        console.log('Error checking auto-trigger:', error);
      }
    };
    
    checkAutoTrigger();
  }, []);

  const handleAutoTriggerAnalysis = () => {
    console.log('Auto-trigger analysis started');
    setShowAutoTrigger(false);
    // Set a flag to trigger analysis immediately when DOM component loads
    setTimeout(() => {
      // Give DOM component time to mount, then trigger analysis
      const event = new CustomEvent('triggerAnalysis');
      window.dispatchEvent(event);
    }, 100);
  };

  const handleAutoTriggerDismiss = async () => {
    setShowAutoTrigger(false);
    
    // Notify background script to temporarily disable auto-trigger
    try {
      if ((window as any).chrome?.runtime) {
        await chrome.runtime.sendMessage({ type: 'DISABLE_AUTO_TRIGGER' });
      }
    } catch (error) {
      console.log('Error disabling auto-trigger:', error);
    }
  };

  const handleReportFormClose = () => {
    setShowReportForm(false);
    setReportData(null);
  };

  // Show report form if requested
  if (showReportForm && reportData) {
    return (
      <div className="w-[450px] h-[600px] flex flex-col border relative">
        <ReportForm 
          isVisible={true}
          onClose={handleReportFormClose}
          reportData={reportData}
        />
      </div>
    );
  }

  // Show auto-trigger UI if we have auto-trigger data
  if (showAutoTrigger && autoTriggerData) {
    return (
      <AutoTrigger 
        onTriggerAnalysis={handleAutoTriggerAnalysis}
        onDismiss={handleAutoTriggerDismiss}
        pageTitle={autoTriggerData.title}
        pageUrl={autoTriggerData.url}
      />
    );
  }

  // Default UI for manual extension opening
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