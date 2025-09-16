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

export const Verification = ({ data }: VerificationProps) => {
  
  if (data) {
    console.log('🤖 AI ANALYSIS READY - Full content received:', data);
    console.log('📋 Title:', data.title);
    console.log('📄 Full Content Length:', data.fullContent.length);
    console.log('📝 Content Preview:', data.fullContent.substring(0, 200) + '...');
    console.log('🔗 External Sources:', data.sources);
    console.log('🌐 Page URL:', data.pageUrl);
    console.log('🏷️ Domain:', data.domain);
    console.log('⏰ Extracted at:', data.timestamp);
  }

  return (
    <div className="p-4 border-t bg-gray-50">
      <h3 className="font-bold mb-2 text-gray-800">🤖 AI Verification Component</h3>
      {data ? (
        <div className="space-y-2 text-sm">
          <div className="bg-green-100 border border-green-300 rounded p-2">
            <p className="font-medium text-green-800">✅ Content Ready for AI Analysis!</p>
            <p className="text-green-700">📊 Content: {data.fullContent.length} characters</p>
            <p className="text-green-700">🔗 Sources: {data.sources.length} external domains</p>
            <p className="text-green-700">🏷️ From: {data.domain}</p>
          </div>
          <p className="text-gray-600 text-xs">
            🔍 Check console for full content ready for AI misinformation detection
          </p>
        </div>
      ) : (
        <div className="bg-gray-100 border border-gray-300 rounded p-2">
          <p className="text-gray-600 text-sm">
            ⏳ Waiting for content extraction from DOM component...
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Click "🔍 Analyze" in DOM component to extract content for AI analysis
          </p>
        </div>
      )}
    </div>
  );
};