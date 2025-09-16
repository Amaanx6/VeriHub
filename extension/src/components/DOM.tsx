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
      .filter((source, index, arr) => arr.indexOf(source) === index) // Remove duplicates
      .slice(0, 15); // Limit to prevent overwhelming data

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
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tabs[0]?.id) {
        const response: DomResponse = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(
            tabs[0].id!,
            { type: "GET_DOM" },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
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
          setVerificationData(verification);
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

  const analyzeContent = () => {
    if (!verificationData) return;
    
    // Get clean content for AI analysis
    const analysisData = verificationData.exportForAnalysis();
    
    console.log('🔍 DOM COMPONENT: Sending clean content to AI for analysis:', analysisData);
    
    // Send to parent component for AI processing
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

  useEffect(() => {
    fetchContent();
  }, []);

  return (
    <div className="w-[450px] h-[600px] flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-blue-50">
        <h2 className="text-lg font-bold text-blue-800">VeriHub - Fact Checker</h2>
        {verificationData && (
          <p className="text-sm text-blue-600 truncate">{verificationData.domain}</p>
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
            >
              🔍 Analyze
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
            {/* Title */}
            <div className="bg-gray-50 rounded p-3">
              <h3 className="font-medium mb-1">Article Title</h3>
              <p className="text-sm">{verificationData.title}</p>
            </div>

            {/* Content Preview */}
            <div className="bg-blue-50 rounded p-3">
              <h3 className="font-medium mb-2">Content for AI Analysis</h3>
              <p className="text-sm text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                {verificationData.content.substring(0, 500)}
                {verificationData.content.length > 500 && '...'}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Total: {verificationData.content.length} characters
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
                  AI can check credibility of these sources
                </p>
              </div>
            )}

            {/* AI Ready Indicator */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h3 className="font-medium text-yellow-800 mb-1">🤖 Ready for AI Analysis</h3>
              <p className="text-sm text-yellow-700">
                Clean content extracted and ready to be analyzed by AI for:
              </p>
              <ul className="text-xs text-yellow-700 mt-1 ml-4 space-y-1">
                <li>• Misinformation detection</li>
                <li>• Fact checking</li>
                <li>• Bias analysis</li>
                <li>• Source credibility</li>
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