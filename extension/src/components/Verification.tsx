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

  // Initialize Gemini AI directly in frontend (unsafe!)
  const ai = new GoogleGenAI({
    apiKey: "AIzaSyDw3gZLfiDz3-TVSxsY0HjekOdzobiYsNA", // exposed key (unsafe)
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
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab?.id) {
        // Send the verification results to content script
        await chrome.tabs.sendMessage(tab.id, {
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

    setLoading(true);
    setError("");
    setVerificationResult(null);

    try {
      const prompt = createPrompt(data);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (!response.text) throw new Error("No response from Gemini");

      const result = parseAIResponse(response.text);
      setVerificationResult(result);

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

  // Auto-analyze when data changes
  useEffect(() => {
    if (data) {
      console.log('🔄 Auto-analyzing new content...');
      sendToAI(data);
    }
  }, [data]);

  return (
    <div className="p-4 border-t bg-gray-50 w-[450px] h-[600px] overflow-auto">
      <h3 className="font-bold mb-2 text-gray-800">🤖 AI Verification Component</h3>

      {loading && <p className="text-gray-500">Analyzing content... ⏳</p>}
      {error && <p className="text-red-700">{error}</p>}

      {!data && !loading && (
        <p className="text-gray-600">Waiting for content extraction from DOM component...</p>
      )}

      {data && verificationResult && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <p className="font-medium text-green-800">✅ Content ready for AI analysis</p>
            <p className="text-green-700">Length: {data.fullContent.length} chars</p>
            <p className="text-green-700">Sources: {data.sources.length}</p>
            <p className="text-green-700">Domain: {data.domain}</p>
          </div>

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