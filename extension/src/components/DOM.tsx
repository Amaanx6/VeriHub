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
  //@ts-ignore
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  //@ts-ignore
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState<string>("");
  //@ts-ignore
  const [analysisCount, setAnalysisCount] = useState<number>(0);

  // Rate limiting - max 3 analyses per minute
  const MAX_ANALYSES_PER_MINUTE = 3;
  const analysisTimestamps = useState<number[]>([])[0];

  // Check if analysis should be performed (rate limiting)
  //@ts-ignore
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
  //@ts-ignore
  const recordAnalysis = () => {
    analysisTimestamps.push(Date.now());
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
            console.log('📄 Content changed, updating verification data');
            setVerificationData(verification);
            setLastAnalyzedUrl(verification.url);
          } else {
            console.log('📄 Content unchanged, skipping update');
          }
        } else {
          setError("No content received");
        }
      } else {
        setError("No active tab found");
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Failed to get content'}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-analyze content when verification data is ready (only on manual trigger now)
  useEffect(() => {
    // Remove automatic analysis - will be triggered by content script signal instead
  }, [verificationData, onAnalysisReady]);

  const analyzeContent = () => {
    if (!verificationData) return;
    
    const analysisData = verificationData.exportForAnalysis();
    
    console.log('🔍 DOM COMPONENT: Manual analysis triggered:', analysisData);
    
    onAnalysisReady?.(analysisData);
    
    alert(`Clean content extracted for AI analysis!\n\nTitle: ${analysisData.title}\nContent: ${analysisData.fullContent.length} characters\nSources: ${analysisData.sources.length}\n\nAI can now analyze this for misinformation!`);
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
    console.log('🚀 DOM Component mounted - initial content fetch');
    fetchContent();
  }, []); // Empty dependency array ensures this runs only once

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
          console.log('🔄 Page loaded (debounced), refetching content...');
          fetchContent();
        }, 2000);
      }
    };

    // Listen for content script ready signal (with debouncing)
    const handleMessage = (message: any) => {
      if (message.type === 'CONTENT_SCRIPT_READY') {
        // Clear existing timer
        clearTimeout(debounceTimer);
        
        // Debounce for 1 second
        debounceTimer = window.setTimeout(() => {
          console.log('🚀 Content script ready (debounced), fetching content...');
          fetchContent();
        }, 1000);
      }
    };

    try {
      const chromeApi = (window as any).chrome;
      if (chromeApi?.tabs?.onUpdated) {
        chromeApi.tabs.onUpdated.addListener(handleTabUpdated);
      }
      if (chromeApi?.runtime?.onMessage) {
        chromeApi.runtime.onMessage.addListener(handleMessage);
      }
    } catch (error) {
      console.log('Extension APIs not available in this context');
    }

    return () => {
      clearTimeout(debounceTimer);
      try {
        const chromeApi = (window as any).chrome;
        if (chromeApi?.tabs?.onUpdated) {
          chromeApi.tabs.onUpdated.removeListener(handleTabUpdated);
        }
        if (chromeApi?.runtime?.onMessage) {
          chromeApi.runtime.onMessage.removeListener(handleMessage);
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

      {/* Controls */}
      <div className="p-3 border-b flex gap-2">
        <button
          onClick={fetchContent}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
        
        {verificationData && (
          <>
            <button
              onClick={analyzeContent}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              title="Manual analysis (auto-analysis is already running)"
            >
              🔍 Re-analyze
            </button>
            <button
              onClick={copyData}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Copy Data
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
            {/* Auto-Analysis Status */}
            <div className={`rounded p-3 ${analyzing ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${analyzing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                <h3 className={`font-medium ${analyzing ? 'text-yellow-800' : 'text-green-800'}`}>
                  {analyzing ? '🤖 AI Analysis in Progress...' : '✅ Content Auto-Analyzed'}
                </h3>
              </div>
              <p className={`text-sm mt-1 ${analyzing ? 'text-yellow-700' : 'text-green-700'}`}>
                {analyzing ? 'Checking for false claims and misinformation...' : 'AI has analyzed this content for misinformation. Check below for results.'}
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
              <h3 className="font-medium mb-2">Content Analyzed by AI</h3>
              <p className="text-sm text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                {verificationData.content.substring(0, 500)}
                {verificationData.content.length > 500 && '...'}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Total: {verificationData.content.length} characters analyzed
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
                <p className="text-xs text-green-600 mt-2">
                  AI has checked credibility of these sources
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-purple-50 border border-purple-200 rounded p-3">
              <h3 className="font-medium text-purple-800 mb-1">📋 How it works</h3>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Content is automatically analyzed when page loads</li>
                <li>• False claims are highlighted with colored underlines</li>
                <li>• Hover over highlighted text to see fact corrections</li>
                <li>• Different colors indicate severity levels</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">🔍</div>
              <div>Click "Refresh" to extract content for AI analysis</div>
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