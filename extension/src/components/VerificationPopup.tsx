import { useState } from 'react';

interface VerificationPopupProps {
  isVisible: boolean;
  onVerify: () => void;
  onDismiss: () => void;
  pageTitle?: string;
  domain?: string;
}

export const VerificationPopup = ({ 
  isVisible, 
  onVerify, 
  onDismiss, 
  pageTitle, 
  domain 
}: VerificationPopupProps) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    onVerify();
    setTimeout(() => {
      setIsVerifying(false);
      onDismiss();
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6 animate-fadeIn">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
            V
          </div>
          <h2 className="text-lg font-semibold text-gray-800">VeriHub Fact Checker</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">New page detected:</p>
          <div className="bg-gray-50 rounded p-3">
            <p className="font-medium text-sm truncate">{pageTitle || 'Untitled Page'}</p>
            <p className="text-xs text-gray-500 truncate">{domain}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Would you like to analyze this page for misinformation and false claims?
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 font-medium"
          >
            {isVerifying ? 'Analyzing...' : 'Check for False Claims'}
          </button>
          <button
            onClick={onDismiss}
            disabled={isVerifying}
            className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};