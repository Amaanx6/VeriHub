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
      <div className="bg-white max-w-md mx-4 p-6 border-4 border-red-500 transform">
        <div className="flex items-center mb-8">
          <div className="w-12 h-12 bg-red-500 text-white flex items-center justify-center font-black text-xl transform -skew-x-12 mr-4">
            V
          </div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-black">VERIHUB FACT CHECKER</h2>
        </div>
        
        <div className="mb-8">
          <p className="text-black font-black uppercase tracking-wide mb-4">NEW PAGE DETECTED:</p>
          <div className="bg-gray-800 p-4 border-4 border-white">
            <p className="font-black text-white uppercase tracking-wide text-sm truncate">{pageTitle || 'UNTITLED PAGE'}</p>
            <p className="text-red-400 text-xs font-bold uppercase tracking-wide truncate">{domain}</p>
          </div>
        </div>

        <p className="text-black font-bold uppercase tracking-wide mb-8">
          ANALYZE THIS PAGE FOR MISINFORMATION AND FALSE CLAIMS?
        </p>

        <div className="flex space-x-4">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex-1 bg-red-500 text-white py-6 px-8 border-4 border-white font-black text-lg uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isVerifying ? 'ANALYZING...' : 'CHECK FOR FALSE CLAIMS'}
          </button>
          <button
            onClick={onDismiss}
            disabled={isVerifying}
            className="bg-gray-800 text-white py-6 px-8 border-4 border-white font-black text-lg uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            SKIP
          </button>
        </div>
      </div>
    </div>
  );
};