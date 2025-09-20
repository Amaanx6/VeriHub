// Updated DOM component with pending analysis check
import { useEffect, useState } from "react";

interface DomResponse {
  dom: string;
  url?: string;
  title?: string;
}

interface AnalysisData {
  title: string;
  fullContent: string;
  sources: string[];
  pageUrl: string;
  domain: string;
  timestamp: string;
}

interface VerificationData {
  title: string;
  content: string;
  sources: string[];
  url: string;
  domain: string;
  exportForAnalysis: () => AnalysisData;
}

interface DOMProps {
  onAnalysisReady?: (data: AnalysisData) => void;
}

export function DOM({ onAnalysisReady }: DOMProps) {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  //@ts-ignore
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState<string>("");
  const [analysisCount, setAnalysisCount] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Rate limiting - max 3 analyses per minute
  const MAX_ANALYSES_PER_MINUTE = 3;
  const analysisTimestamps = useState<number[]>([])[0];

  // Debug logging
  const addDebug = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev.slice(-8), `${time}: ${message}`]);
    console.log(`DOM DEBUG: ${message}`);
  };

  // Listen for auto-trigger events
  useEffect(() => {
    const handleAutoTrigger = () => {
      addDebug('Auto-trigger event received');
      // Give a small delay to ensure verificationData is loaded
      setTimeout(() => {
        if (verificationData) {
          addDebug('Auto-trigger: calling triggerAnalysis()');
          triggerAnalysis();
        } else {
          addDebug('Auto-trigger: no verification data yet, will retry...');
          // Retry after a longer delay if data isn't ready yet
          setTimeout(() => {
            if (verificationData) {
              addDebug('Auto-trigger retry: calling triggerAnalysis()');
              triggerAnalysis();
            }
          }, 1000);
        }
      }, 200);
    };

    window.addEventListener('triggerAnalysis', handleAutoTrigger);
    
    return () => {
      window.removeEventListener('triggerAnalysis', handleAutoTrigger);
    };
  }, [verificationData]);

  // Check if analysis should be performed (rate limiting)
  const canAnalyze = () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
   
    // Remove old timestamps
    const recentTimestamps = analysisTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    analysisTimestamps.length = 0;
    analysisTimestamps.push(...recentTimestamps);
   
    return analysisTimestamps.length < MAX_ANALYSES_PER_MINUTE;
  };

  // Add analysis timestamp
  const recordAnalysis = () => {
    analysisTimestamps.push(Date.now());
    setAnalysisCount(prev => prev + 1);
  };

  // Check if content has changed significantly
  const hasContentChanged = (newData: VerificationData) => {
    if (!verificationData) return true;
   
    // Check URL change
    if (newData.url !== verificationData.url) return true;
   
    // Check content length change (more than 10%)
    const lengthDiff = Math.abs(newData.content.length - verificationData.content.length);
    const lengthChangePercent = lengthDiff / verificationData.content.length;
    if (lengthChangePercent > 0.1) return true;
   
    // Check title change
    if (newData.title !== verificationData.title) return true;
   
    return false;
  };

  const extractVerificationData = (htmlString: string, pageUrl: string, pageTitle: string): VerificationData => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
   
    // Remove unwanted elements (scripts, ads, navigation)
    const unwantedElements = doc.querySelectorAll('script, style, nav, header, footer, .ad, .advertisement, .sidebar, .menu, .social-share, .comments');
    unwantedElements.forEach(el => el.remove());
   
    // Get main content - prioritize article/main content areas
    const contentSelectors = ['article', 'main', '.content', '.post', '.article-body', '.story-body'];
    let mainContent = null;
   
    for (const selector of contentSelectors) {
      mainContent = doc.querySelector(selector);
      if (mainContent) break;
    }
   
    // Fallback to body if no main content found
    const contentArea = mainContent || doc.body;
    const content = contentArea?.textContent?.replace(/\s+/g, ' ').trim() || '';

    // Extract sources (external domains only)
    const links = Array.from(doc.querySelectorAll('a[href]'));
    const currentDomain = pageUrl ? new URL(pageUrl).hostname.replace('www.', '') : '';
   
    const sources = links
      .map(link => {
        const href = link.getAttribute('href') || '';
        try {
          if (href.startsWith('http')) {
            const linkDomain = new URL(href).hostname.replace('www.', '');
            // Only include external sources
            return linkDomain !== currentDomain ? linkDomain : null;
          }
        } catch (e) {}
        return null;
      })
      .filter((source): source is string => source !== null)
      .filter((source, index, arr) => arr.indexOf(source) === index)
      .slice(0, 15);

    const domain = currentDomain;

    return {
      title: pageTitle || 'Untitled',
      content,
      sources,
      url: pageUrl,
      domain,
      exportForAnalysis: (): AnalysisData => ({
        title: pageTitle || 'Untitled',
        fullContent: content,
        sources,
        pageUrl,
        domain,
        timestamp: new Date().toISOString()
      })
    };
  };

  const fetchContent = async () => {
    setLoading(true);
    setError("");
    addDebug("Starting content fetch...");
   
    try {
      // Use any type to avoid TypeScript errors with chrome APIs
      const chromeApi = (window as any).chrome;
     
      if (!chromeApi?.tabs) {
        throw new Error("Chrome extension APIs not available");
      }

      const tabs = await chromeApi.tabs.query({ active: true, currentWindow: true });
     
      if (tabs[0]?.id) {
        const response: DomResponse = await new Promise((resolve, reject) => {
          chromeApi.tabs.sendMessage(
            tabs[0].id!,
            { type: "GET_DOM" },
            (response: any) => {
              if (chromeApi.runtime?.lastError) {
                reject(new Error(chromeApi.runtime.lastError.message));
              } else if (response) {
                resolve(response);
              } else {
                reject(new Error("No response from content script"));
              }
            }
          );
        });
       
        if (response?.dom) {
          const verification = extractVerificationData(
            response.dom,
            response.url || tabs[0].url || "",
            response.title || tabs[0].title || ""
          );
         
          // Only update if content has actually changed
          if (hasContentChanged(verification)) {
            addDebug(`Content changed, updating verification data for: ${verification.domain}`);
            setVerificationData(verification);
            setLastAnalyzedUrl(verification.url);
          } else {
            addDebug('Content unchanged, skipping update');
          }
        } else {
          setError("No content received");
          addDebug("No DOM content received from content script");
        }
      } else {
        setError("No active tab found");
        addDebug("No active tab found");
      }
    } catch (err) {
      const errorMsg = `Error: ${err instanceof Error ? err.message : 'Failed to get content'}`;
      setError(errorMsg);
      addDebug(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Check for pending analysis from background script
  const checkPendingAnalysis = async () => {
    try {
      const chromeApi = (window as any).chrome;
      if (!chromeApi?.runtime) return;

      const response = await chromeApi.runtime.sendMessage({
        type: 'CHECK_PENDING_ANALYSIS'
      });

      if (response?.hasPending && verificationData) {
        addDebug(`Pending analysis found for: ${response.data.url}`);
        if (response.data.url === verificationData.url) {
          addDebug('URL matches current page, triggering analysis');
          triggerAnalysis();
        }
      }
    } catch (error) {
      addDebug('No pending analysis or popup not available');
    }
  };

  // Listen for direct analysis triggers
  useEffect(() => {
    const handleMessage = (request: any) => {
      if (request.type === 'TRIGGER_ANALYSIS_DIRECT') {
        addDebug('Received direct analysis trigger from background');
        if (verificationData && request.url === verificationData.url) {
          addDebug('URL matches, triggering analysis');
          triggerAnalysis();
        }
      }
    };

    const chromeApi = (window as any).chrome;
    if (chromeApi?.runtime?.onMessage) {
      chromeApi.runtime.onMessage.addListener(handleMessage);
    }

    return () => {
      if (chromeApi?.runtime?.onMessage) {
        chromeApi.runtime.onMessage.removeListener(handleMessage);
      }
    };
  }, [verificationData]);

  // Trigger analysis (manual or from webpage popup)
  const triggerAnalysis = () => {
    addDebug('🚀 triggerAnalysis() called');
    console.log('🚀 DOM triggerAnalysis called');
    
    if (verificationData && onAnalysisReady && canAnalyze()) {
      addDebug('✅ All conditions met, starting analysis...');
      console.log('✅ DOM: All conditions met, calling onAnalysisReady');
      setAnalyzing(true);
      recordAnalysis();
      
      const analysisData = verificationData.exportForAnalysis();
      addDebug(`📤 Calling onAnalysisReady with data for: ${analysisData.domain}`);
      console.log('📤 DOM calling onAnalysisReady with:', analysisData);
      onAnalysisReady(analysisData);
      
      // Set analyzing to false after a delay
      setTimeout(() => setAnalyzing(false), 3000);
    } else if (!verificationData) {
      addDebug('❌ Cannot trigger analysis: No verification data');
      console.log('❌ DOM: No verification data');
    } else if (!onAnalysisReady) {
      addDebug('❌ Cannot trigger analysis: No callback function');
      console.log('❌ DOM: No onAnalysisReady callback');
    } else if (!canAnalyze()) {
      addDebug('❌ Cannot trigger analysis: Rate limit exceeded');
      console.log('❌ DOM: Rate limit exceeded');
    }
  };

  const copyData = async () => {
    if (!verificationData) return;
   
    try {
      await navigator.clipboard.writeText(JSON.stringify(verificationData, null, 2));
      alert('Verification data copied to clipboard!');
    } catch (err) {
      setError('Failed to copy data');
    }
  };

  // Auto-fetch content when component mounts (only once)
  useEffect(() => {
    addDebug('DOM Component mounted - initial content fetch');
    fetchContent();
  }, []);

  // Check for pending analysis after verificationData is loaded
  useEffect(() => {
    if (verificationData) {
      addDebug('Verification data loaded, checking for pending analysis...');
      // Small delay to ensure everything is set up
      setTimeout(checkPendingAnalysis, 500);
    }
  }, [verificationData]);

  // Listen for tab updates or page changes (with debouncing)
  useEffect(() => {
    let debounceTimer: number;
    //@ts-ignore
    const handleTabUpdated = (tabId: number, changeInfo: any) => {
      if (changeInfo.status === 'complete') {
        // Clear existing timer
        clearTimeout(debounceTimer);
       
        // Debounce for 2 seconds
        debounceTimer = window.setTimeout(() => {
          addDebug('Page loaded (debounced), refetching content...');
          fetchContent();
        }, 2000);
      }
    };

    try {
      const chromeApi = (window as any).chrome;
      if (chromeApi?.tabs?.onUpdated) {
        chromeApi.tabs.onUpdated.addListener(handleTabUpdated);
        addDebug("Tab update listener attached");
      }
    } catch (error) {
      addDebug('Extension APIs not available in this context');
    }

    return () => {
      clearTimeout(debounceTimer);
      try {
        const chromeApi = (window as any).chrome;
        if (chromeApi?.tabs?.onUpdated) {
          chromeApi.tabs.onUpdated.removeListener(handleTabUpdated);
        }
      } catch (error) {
        // Extension context might not be available
      }
    };
  }, []);

  return (
    <div className="w-[450px] h-[600px] flex flex-col bg-black border-4 border-red-500 overflow-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-white text-black p-6 border-b-4 border-red-500">
        <h2 className="text-2xl font-black uppercase tracking-wider">VERIHUB - FACT CHECKER</h2>
        {verificationData && (
          <p className="font-black uppercase tracking-wide text-sm mt-2">{verificationData.domain}</p>
        )}
        {analyzing && (
          <div className="flex items-center mt-4">
            <div className="w-4 h-4 bg-red-500 animate-pulse mr-4"></div>
            <span className="font-black uppercase tracking-wide text-xs">ANALYZING FOR MISINFORMATION...</span>
          </div>
        )}
      </div>

      {/* DEBUG SECTION */}
      <div className="p-6 border-b-4 border-red-500 bg-gray-800">
        <h3 className="font-black text-white uppercase tracking-wide mb-4">DEBUG LOG (WITH PENDING CHECK):</h3>
        <div className="text-xs text-white max-h-32 overflow-y-auto space-y-1 font-bold" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {debugInfo.length === 0 ? (
            <p className="uppercase tracking-wide">NO DEBUG INFO YET...</p>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} className="uppercase tracking-wide">{info}</div>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-b-4 border-red-500 bg-black flex gap-4 flex-wrap">
        <button
          onClick={fetchContent}
          disabled={loading}
          className="bg-red-500 text-white py-4 px-6 border-4 border-white font-black text-sm uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? "LOADING..." : "REFRESH"}
        </button>
       
        {verificationData && (
          <>
            <button
              onClick={triggerAnalysis}
              className="bg-red-500 text-white py-4 px-6 border-4 border-white font-black text-sm uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150"
              title="Manually trigger analysis"
            >
              MANUAL ANALYZE
            </button>
            <button
              onClick={copyData}
              className="bg-green-400 text-black py-4 px-6 border-4 border-white font-black text-sm uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150"
            >
              COPY DATA
            </button>
            <button
              onClick={checkPendingAnalysis}
              className="bg-gray-800 text-white py-4 px-6 border-4 border-white font-black text-sm uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150"
              title="Check for pending analysis triggers"
            >
              CHECK PENDING
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-black" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {error ? (
          <div className="bg-red-500 text-white p-6 border-4 border-white">
            <p className="font-black uppercase tracking-wide">{error}</p>
            <button
              onClick={() => setError("")}
              className="mt-4 bg-white text-black py-2 px-4 font-black uppercase tracking-wide border-2 border-black hover:bg-gray-200 transform hover:scale-105 transition-all duration-150"
            >
              DISMISS
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white font-black uppercase tracking-wider">LOADING CONTENT...</div>
          </div>
        ) : verificationData ? (
          <div className="space-y-8">
            {/* Analysis Status */}
            <div className={`p-6 border-4 border-white ${analyzing ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
              <div className="flex items-center">
                <div className={`w-4 h-4 mr-4 ${analyzing ? 'bg-white animate-pulse' : 'bg-red-500'}`}></div>
                <h3 className="font-black uppercase tracking-wider">
                  {analyzing ? 'AI ANALYSIS IN PROGRESS...' : 'CONTENT READY FOR ANALYSIS'}
                </h3>
              </div>
              <p className="font-bold uppercase tracking-wide text-sm mt-4">
                {analyzing ? 'CHECKING FOR FALSE CLAIMS AND MISINFORMATION...' : 'CLICK THE WEBPAGE POPUP OR "MANUAL ANALYZE" BUTTON.'}
              </p>
              {analysisCount > 0 && (
                <p className="text-white font-bold uppercase tracking-wide text-xs mt-4">
                  ANALYSES PERFORMED: {analysisCount} | RATE LIMIT: {Math.max(0, MAX_ANALYSES_PER_MINUTE - analysisTimestamps.length)} REMAINING
                </p>
              )}
            </div>

            {/* Title */}
            <div className="bg-gray-800 p-6 border-4 border-white">
              <h3 className="font-black text-white uppercase tracking-wide mb-4">ARTICLE TITLE</h3>
              <p className="text-white font-bold uppercase tracking-wide text-sm">{verificationData.title}</p>
            </div>

            {/* Content Preview */}
            <div className="bg-gray-800 p-6 border-4 border-white">
              <h3 className="font-black text-white uppercase tracking-wide mb-6">CONTENT READY FOR ANALYSIS</h3>
              <p className="text-white font-bold text-sm leading-relaxed max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                  p::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {verificationData.content.substring(0, 500).toUpperCase()}
                {verificationData.content.length > 500 && '...'}
              </p>
              <p className="text-red-400 font-bold uppercase tracking-wide text-xs mt-6">
                TOTAL: {verificationData.content.length} CHARACTERS READY FOR ANALYSIS
              </p>
            </div>

            {/* Sources */}
            {verificationData.sources.length > 0 && (
              <div className="bg-green-400 text-black p-6 border-4 border-white">
                <h3 className="font-black uppercase tracking-wide mb-6">EXTERNAL SOURCES ({verificationData.sources.length})</h3>
                <div className="space-y-2 max-h-24 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <style>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {verificationData.sources.map((source, index) => (
                    <div key={index} className="font-bold bg-white text-black px-4 py-2 border-2 border-black text-xs uppercase tracking-wide">
                      {source}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-800 p-6 border-4 border-white">
              <h3 className="font-black text-white uppercase tracking-wide mb-4">HOW IT WORKS</h3>
              <ul className="text-white font-bold uppercase tracking-wide text-xs space-y-2">
                <li>• A POPUP APPEARS DIRECTLY ON THE WEBPAGE WHEN CONTENT LOADS</li>
                <li>• CLICK "CHECK FOR FALSE CLAIMS" IN THE POPUP TO TRIGGER ANALYSIS</li>
                <li>• EXTENSION AUTOMATICALLY CHECKS FOR PENDING TRIGGERS</li>
                <li>• FALSE CLAIMS WILL BE HIGHLIGHTED ON THE WEBPAGE</li>
                <li>• HOVER OVER HIGHLIGHTS TO SEE CORRECTIONS</li>
                <li>• CHECK DEBUG LOG ABOVE TO SEE TRIGGER STATUS</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <div className="text-4xl mb-6">V</div>
              <div className="font-black uppercase tracking-wider">CLICK "REFRESH" TO EXTRACT CONTENT</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {verificationData && (
        <div className="p-6 border-t-4 border-red-500 bg-white text-black font-black uppercase tracking-wide text-xs flex justify-between">
          <span>CONTENT: {verificationData.content.length} CHARS</span>
          <span>SOURCES: {verificationData.sources.length}</span>
          <span>DOMAIN: {verificationData.domain}</span>
        </div>
      )}
    </div>
  );
}