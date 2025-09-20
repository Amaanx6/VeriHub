import { useEffect, useState } from "react";
import { GoogleGenAI } from "@google/genai";

interface AnalysisData {
  title: string;
  fullContent: string;
  sources: string[];
  pageUrl: string;
  domain: string;
  timestamp: string;
}

interface VerificationProps {
  data: AnalysisData | null;
}

interface VerificationIssue {
  claim: string;
  reason: string;
  severity: "low" | "medium" | "high";
  correction: string;
}

interface VerificationResult {
  flagged: boolean;
  issues: VerificationIssue[];
  summary: string;
}

export const Verification = ({ data }: VerificationProps) => {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastAnalyzedData, setLastAnalyzedData] = useState<string>("");
  const [analysisCount, setAnalysisCount] = useState<number>(0);

  
  const ai = new GoogleGenAI({
    apiKey: "AIzaSyCPfUZesLywczPOXbVZ4POwf0GVGCHEhfI", 
  });

  const createPrompt = (data: AnalysisData): string => `
You are an AI fact-checker. Analyze the following page content:

${JSON.stringify(data, null, 2)}

Instructions:
- Only respond with valid JSON.
- Do NOT include markdown, backticks, or extra text.
- For each issue, include the EXACT text from the content that contains the false claim
- Format:
{
  "flagged": true | false,
  "issues": [
    {
      "claim": "exact text from content that is false",
      "reason": "why this claim is false or misleading",
      "severity": "low" | "medium" | "high",
      "correction": "the correct information or fact"
    }
  ],
  "summary": "short summary"
}
`;

  const parseAIResponse = (text: string): VerificationResult => {
    try {
      // Remove ```json or ``` if the AI wraps the response
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse AI JSON:", err, text);
      throw new Error("AI returned invalid JSON");
    }
  };

  // Send verification results to content script
  const sendResultsToContentScript = async (results: VerificationResult) => {
    if (!data?.pageUrl) return;

    try {
      // Use any type to avoid TypeScript errors with chrome APIs
      const chromeApi = (window as any).chrome;
      
      if (!chromeApi?.tabs) {
        console.log('Chrome extension APIs not available');
        return;
      }

      // Get the current active tab
      const [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
      
      if (tab?.id) {
        // Send the verification results to content script
        await chromeApi.tabs.sendMessage(tab.id, {
          type: "HIGHLIGHT_FALSE_CLAIMS",
          data: {
            issues: results.issues,
            pageUrl: data.pageUrl
          }
        });
        
        console.log('✅ Sent verification results to content script');
      }
    } catch (error) {
      console.error('❌ Failed to send results to content script:', error);
    }
  };

  const sendToAI = async (data: AnalysisData) => {
    if (!data) return;

    // Create a content hash to avoid re-analyzing same content
    function safeBtoa(str: string): string {
      return btoa(unescape(encodeURIComponent(str)));
    }

    // MODIFIED: Include timestamp in hash to allow re-analysis of same content
    const contentForHash = data.fullContent.substring(0, 1000) + data.timestamp;
    const contentHash = safeBtoa(contentForHash).substring(0, 50);

    
    // Skip if same content was already analyzed VERY recently (within 5 seconds)
    if (contentHash === lastAnalyzedData) {
      console.log('🔄 Skipping AI analysis - same content analyzed within 5 seconds');
      return;
    }

    setLoading(true);
    setError("");
    setVerificationResult(null);
    setAnalysisCount(prev => prev + 1);

    try {
      const prompt = createPrompt(data);

      console.log(`🤖 Sending request to Gemini AI... (Analysis #${analysisCount + 1})`);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (!response.text) throw new Error("No response from Gemini");

      const result = parseAIResponse(response.text);
      setVerificationResult(result);
      setLastAnalyzedData(contentHash);

      // Send results to content script for highlighting
      if (result.issues.length > 0) {
        await sendResultsToContentScript(result);
      }

      console.log("🤖 Gemini Verification Result:", result);
    } catch (err) {
      setError(`AI verification failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // MODIFIED: Trigger analysis whenever new data arrives (including same content with new timestamp)
  useEffect(() => {
    if (data && data.timestamp) {
      console.log('🔄 Analysis triggered - data received with timestamp:', data.timestamp);
      sendToAI(data);
    }
  }, [data?.timestamp]); // Watch for timestamp changes specifically

  // ALSO watch for URL changes to reset state
  useEffect(() => {
    if (data?.pageUrl) {
      console.log('🔄 New page detected:', data.pageUrl);
      // Reset verification result when page changes
      if (lastAnalyzedData && !lastAnalyzedData.includes(data.pageUrl)) {
        setVerificationResult(null);
        setLastAnalyzedData("");
      }
    }
  }, [data?.pageUrl]);

  return (
    <div className="p-6 border-t-4 border-red-500 bg-black w-[450px] h-[600px] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <h3 className="font-black text-white text-lg uppercase tracking-wide mb-8">AI VERIFICATION COMPONENT</h3>

      {loading && (
        <div className="bg-red-500 text-white p-6 border-4 border-white mb-8">
          <p className="font-black uppercase tracking-wide">ANALYZING CONTENT... (ANALYSIS #{analysisCount})</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-500 text-white p-6 border-4 border-white mb-8">
          <p className="font-black uppercase tracking-wide">{error}</p>
        </div>
      )}

      {!data && !loading && (
        <p className="text-white font-bold uppercase tracking-wide">WAITING FOR ANALYSIS TRIGGER FROM WEBPAGE POPUP OR MANUAL BUTTON...</p>
      )}

      {data && (
        <div className="bg-green-400 text-black p-6 border-4 border-white mb-8">
          <p className="font-black uppercase tracking-wide mb-4">DATA RECEIVED FOR ANALYSIS</p>
          <p className="font-bold uppercase tracking-wide text-sm">URL: {data.pageUrl}</p>
          <p className="font-bold uppercase tracking-wide text-sm">TIMESTAMP: {new Date(data.timestamp).toLocaleTimeString()}</p>
          <p className="font-bold uppercase tracking-wide text-sm">CONTENT: {data.fullContent.length} CHARS</p>
          <p className="font-bold uppercase tracking-wide text-sm">TOTAL ANALYSES RUN: {analysisCount}</p>
        </div>
      )}

      {data && verificationResult && (
        <div className="space-y-8">
          <div className="bg-gray-800 p-6 border-4 border-white">
            <h4 className="font-black text-white uppercase tracking-wide mb-4">AI ANALYSIS SUMMARY</h4>
            <p className="text-white font-bold uppercase tracking-wide text-sm">{verificationResult.summary}</p>
          </div>

          {verificationResult.issues.length > 0 && (
            <div className="bg-red-500 text-white p-6 border-4 border-white">
              <h4 className="font-black uppercase tracking-wide mb-6">FLAGGED ISSUES ({verificationResult.issues.length})</h4>
              <p className="text-white font-bold uppercase tracking-wide text-xs mb-6">FALSE CLAIMS HAVE BEEN HIGHLIGHTED ON THE WEBPAGE</p>
              <div className="space-y-4 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {verificationResult.issues.map((issue, idx) => (
                  <div key={idx} className="bg-white text-black border-4 border-gray-800 p-4">
                    <p className="font-black uppercase tracking-wide text-sm mb-2"><strong>CLAIM:</strong> {issue.claim}</p>
                    <p className="font-black uppercase tracking-wide text-sm mb-2"><strong>REASON:</strong> {issue.reason}</p>
                    <p className="font-black uppercase tracking-wide text-sm mb-2"><strong>SEVERITY:</strong> 
                      <span className={`ml-2 px-3 py-1 border-2 font-black uppercase tracking-wide text-xs ${
                        issue.severity === 'high' ? 'bg-red-500 text-white border-white' :
                        issue.severity === 'medium' ? 'bg-red-500 text-white border-white' :
                        'bg-gray-800 text-white border-white'
                      }`}>
                        {issue.severity}
                      </span>
                    </p>
                    <p className="font-black uppercase tracking-wide text-sm"><strong>CORRECTION:</strong> {issue.correction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verificationResult.issues.length === 0 && !verificationResult.flagged && (
            <div className="bg-green-400 text-black p-6 border-4 border-white">
              <p className="font-black uppercase tracking-wide text-sm">NO ISSUES DETECTED BY AI.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};