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
    <div className="p-4 border-t bg-gray-50 w-[450px] h-[600px] overflow-auto">
      <h3 className="font-bold mb-2 text-gray-800">🤖 AI Verification Component</h3>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
          <p className="text-blue-700">Analyzing content... ⏳ (Analysis #{analysisCount})</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!data && !loading && (
        <p className="text-gray-600">Waiting for analysis trigger from webpage popup or manual button...</p>
      )}

      {data && (
        <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
          <p className="font-medium text-green-800">✅ Data received for analysis</p>
          <p className="text-green-700 text-sm">URL: {data.pageUrl}</p>
          <p className="text-green-700 text-sm">Timestamp: {new Date(data.timestamp).toLocaleTimeString()}</p>
          <p className="text-green-700 text-sm">Content: {data.fullContent.length} chars</p>
          <p className="text-green-700 text-sm">Total analyses run: {analysisCount}</p>
        </div>
      )}

      {data && verificationResult && (
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded p-2">
            <h4 className="font-semibold mb-1">📝 AI Analysis Summary</h4>
            <p className="text-sm text-gray-700">{verificationResult.summary}</p>
          </div>

          {verificationResult.issues.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <h4 className="font-semibold mb-2">⚠️ Flagged Issues ({verificationResult.issues.length})</h4>
              <p className="text-xs text-gray-600 mb-2">False claims have been highlighted on the webpage</p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {verificationResult.issues.map((issue, idx) => (
                  <div key={idx} className="bg-white border border-yellow-100 rounded p-2 text-sm">
                    <p><strong>Claim:</strong> {issue.claim}</p>
                    <p><strong>Reason:</strong> {issue.reason}</p>
                    <p><strong>Severity:</strong> 
                      <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                        issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                        issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {issue.severity}
                      </span>
                    </p>
                    <p><strong>Correction:</strong> {issue.correction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verificationResult.issues.length === 0 && !verificationResult.flagged && (
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <p className="text-sm text-green-700">✅ No issues detected by AI.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};