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
    <div className="w-[450px] h-[600px] flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-blue-50">
        <h2 className="text-lg font-bold text-blue-800">VeriHub - Fact Checker</h2>
        {verificationData && (
          <p className="text-sm text-blue-600 truncate">{verificationData.domain}</p>
        )}
        {analyzing && (
          <div className="flex items-center mt-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-red-600 font-medium">Analyzing for misinformation...</span>
          </div>
        )}
      </div>

      {/* DEBUG SECTION */}
      <div className="p-3 border-b bg-yellow-50">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Log (With Pending Check):</h3>
        <div className="text-xs text-yellow-700 max-h-32 overflow-y-auto space-y-1 font-mono">
          {debugInfo.length === 0 ? (
            <p>No debug info yet...</p>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index}>{info}</div>
            ))
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-b flex gap-2 flex-wrap">
        <button
          onClick={fetchContent}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
       
        {verificationData && (
          <>
            <button
              onClick={triggerAnalysis}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              title="Manually trigger analysis"
            >
              Manual Analyze
            </button>
            <button
              onClick={copyData}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Copy Data
            </button>
            <button
              onClick={checkPendingAnalysis}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
              title="Check for pending analysis triggers"
            >
              Check Pending
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError("")}
              className="mt-2 text-sm text-red-600 underline"
            >
              Dismiss
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading content...</div>
          </div>
        ) : verificationData ? (
          <div className="space-y-4">
            {/* Analysis Status */}
            <div className={`rounded p-3 ${analyzing ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${analyzing ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'}`}></div>
                <h3 className={`font-medium ${analyzing ? 'text-yellow-800' : 'text-blue-800'}`}>
                  {analyzing ? 'AI Analysis in Progress...' : 'Content Ready for Analysis'}
                </h3>
              </div>
              <p className={`text-sm mt-1 ${analyzing ? 'text-yellow-700' : 'text-blue-700'}`}>
                {analyzing ? 'Checking for false claims and misinformation...' : 'Click the webpage popup or "Manual Analyze" button.'}
              </p>
              {analysisCount > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  Analyses performed: {analysisCount} | Rate limit: {Math.max(0, MAX_ANALYSES_PER_MINUTE - analysisTimestamps.length)} remaining
                </p>
              )}
            </div>

            {/* Title */}
            <div className="bg-gray-50 rounded p-3">
              <h3 className="font-medium mb-1">Article Title</h3>
              <p className="text-sm">{verificationData.title}</p>
            </div>

            {/* Content Preview */}
            <div className="bg-blue-50 rounded p-3">
              <h3 className="font-medium mb-2">Content Ready for Analysis</h3>
              <p className="text-sm text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                {verificationData.content.substring(0, 500)}
                {verificationData.content.length > 500 && '...'}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Total: {verificationData.content.length} characters ready for analysis
              </p>
            </div>

            {/* Sources */}
            {verificationData.sources.length > 0 && (
              <div className="bg-green-50 rounded p-3">
                <h3 className="font-medium mb-2">External Sources ({verificationData.sources.length})</h3>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {verificationData.sources.map((source, index) => (
                    <div key={index} className="text-xs font-mono bg-white px-2 py-1 rounded">
                      {source}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-purple-50 border border-purple-200 rounded p-3">
              <h3 className="font-medium text-purple-800 mb-1">How it works</h3>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• A popup appears directly on the webpage when content loads</li>
                <li>• Click "Check for False Claims" in the popup to trigger analysis</li>
                <li>• Extension automatically checks for pending triggers</li>
                <li>• False claims will be highlighted on the webpage</li>
                <li>• Hover over highlights to see corrections</li>
                <li>• Check debug log above to see trigger status</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">🔍</div>
              <div>Click "Refresh" to extract content</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {verificationData && (
        <div className="p-2 border-t bg-gray-50 text-xs text-gray-600 flex justify-between">
          <span>Content: {verificationData.content.length} chars</span>
          <span>Sources: {verificationData.sources.length}</span>
          <span>Domain: {verificationData.domain}</span>
        </div>
      )}
    </div>
  );
}