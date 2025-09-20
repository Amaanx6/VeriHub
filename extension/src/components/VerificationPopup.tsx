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

        {isVerifying ? (
          <div className="bg-red-500 text-white p-8 border-4 border-white">
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-white border-t-transparent animate-spin"></div>
                <div className="absolute inset-2 border-4 border-white border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-white animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="font-black text-2xl uppercase tracking-wider">AI SCANNING IN PROGRESS</h3>
              <div className="bg-black p-4 border-2 border-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black uppercase tracking-wide text-sm">FACT VERIFICATION</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '400ms' }}></div>
                  </div>
                </div>
                <div className="w-full bg-gray-800 h-2 border border-white">
                  <div className="bg-white h-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="bg-black p-4 border-2 border-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black uppercase tracking-wide text-sm">CLAIM ANALYSIS</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '100ms' }}></div>
                    <div className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '500ms' }}></div>
                  </div>
                </div>
                <div className="w-full bg-gray-800 h-2 border border-white">
                  <div className="bg-white h-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div className="bg-black p-4 border-2 border-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black uppercase tracking-wide text-sm">SOURCE VALIDATION</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '350ms' }}></div>
                    <div className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '550ms' }}></div>
                  </div>
                </div>
                <div className="w-full bg-gray-800 h-2 border border-white">
                  <div className="bg-white h-full animate-pulse" style={{ width: '45%' }}></div>
                </div>
              </div>
              <p className="font-black uppercase tracking-wide text-sm mt-4">
                DEPLOYING ADVANCED AI ALGORITHMS TO DETECT MISINFORMATION
              </p>
            </div>
          </div>
        ) : (
          <div className="flex space-x-4">
            <button
              onClick={handleVerify}
              className="flex-1 bg-red-500 text-white py-6 px-8 border-4 border-white font-black text-lg uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150"
            >
              CHECK FOR FALSE CLAIMS
            </button>
            <button
              onClick={onDismiss}
              className="bg-gray-800 text-white py-6 px-8 border-4 border-white font-black text-lg uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150"
            >
              SKIP
            </button>
          </div>
        )}
      </div>
    </div>
  );
};