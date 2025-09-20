import { useState } from 'react';

const ReportForm = ({ 
  isVisible, 
  onClose, 
  reportData = {} 
}:any) => {
  const [formData, setFormData] = useState({
    category: 'misinformation',
    description: '',
    additionalContext: '',
    userEmail: '',
    flaggedContent: '',
    reason: '',
    correction: '',
    severity: 'medium',
    url: '',
    title: '',
    ...reportData
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleInputChange = (e:any) => {
    const { name, value } = e.target;
    setFormData((prev:any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      alert('Please describe the issue before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      // Prepare the complete report payload
      const reportPayload = {
        url: formData.url || window.location.href,
        title: formData.title || document.title,
        flaggedContent: formData.flaggedContent || '',
        reason: formData.reason || '',
        correction: formData.correction || '',
        severity: formData.severity || 'medium',
        category: formData.category,
        description: formData.description,
        additionalContext: formData.additionalContext,
        userEmail: formData.userEmail,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      // Send to your backend API
      const response = await fetch('https://your-api-endpoint.com/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportPayload)
      });

      if (response.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full h-full bg-black text-white flex flex-col overflow-hidden" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
      <style>{`
        .brutalist-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-white text-black p-6 border-b-4 border-red-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-500 text-white flex items-center justify-center font-black text-xl transform -skew-x-12">
              !
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider">REPORT CONTENT</h1>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-black text-white hover:bg-red-500 font-black text-xl transform hover:scale-110 transition-all duration-150"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 brutalist-scrollbar overflow-y-auto">
        {/* Flagged Content Preview */}
        {formData.flaggedContent && (
          <div className="mb-8 bg-red-500 text-white p-6 border-4 border-white">
            <h2 className="font-black text-lg uppercase mb-4 tracking-wide">FLAGGED CONTENT</h2>
            <div className="bg-black p-4 border-2 border-white">
              <p className="text-sm break-words">
                "{formData.flaggedContent}"
              </p>
              {formData.reason && (
                <div className="mt-4 bg-red-500 p-2">
                  <span className="font-black uppercase">ISSUE:</span> {formData.reason}
                </div>
              )}
            </div>
          </div>
        )}

        {submitStatus === 'success' && (
          <div className="mb-6 bg-green-400 text-black p-6 border-4 border-white">
            <p className="font-black text-lg uppercase">REPORT SUBMITTED</p>
            <p className="font-bold">FORENSIC ANALYSIS INITIATED</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-6 bg-red-500 text-white p-6 border-4 border-white">
            <p className="font-black text-lg uppercase">SUBMISSION FAILED</p>
            <p className="font-bold">RETRY OR CONTACT SUPPORT</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Category */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide">
              CATEGORY
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-4 bg-white text-black border-4 border-gray-800 font-bold uppercase tracking-wide focus:border-red-500 focus:outline-none"
            >
              <option value="misinformation">MISINFORMATION</option>
              <option value="fake-news">FAKE NEWS</option>
              <option value="misleading">MISLEADING CONTENT</option>
              <option value="factual-error">FACTUAL ERROR</option>
              <option value="other">OTHER</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide">
              EVIDENCE DESCRIPTION *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="PROVIDE DETAILED EVIDENCE WHY THIS CONTENT IS FALSE..."
              rows={6}
              className="w-full p-4 bg-white text-black border-4 border-gray-800 font-bold resize-none focus:border-red-500 focus:outline-none placeholder:text-gray-600 placeholder:font-bold"
            />
          </div>

          {/* Additional Context */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide">
              ADDITIONAL EVIDENCE
            </label>
            <textarea
              name="additionalContext"
              value={formData.additionalContext}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="SOURCES, REFERENCES, CONTEXT..."
              rows={4}
              className="w-full p-4 bg-white text-black border-4 border-gray-800 font-bold resize-none focus:border-red-500 focus:outline-none placeholder:text-gray-600 placeholder:font-bold"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide">
              CONTACT EMAIL
            </label>
            <input
              type="email"
              name="userEmail"
              value={formData.userEmail}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="YOUR@EMAIL.COM"
              className="w-full p-4 bg-white text-black border-4 border-gray-800 font-bold focus:border-red-500 focus:outline-none placeholder:text-gray-600 placeholder:font-bold"
            />
          </div>

          {/* Page Info */}
          <div className="bg-gray-800 p-6 border-4 border-white">
            <h3 className="font-black text-lg uppercase mb-4 tracking-wide">SOURCE INFO</h3>
            <div className="space-y-2">
              <p className="font-bold break-words">
                <span className="text-red-400 uppercase">PAGE:</span> {formData.title || document.title}
              </p>
              <p className="font-bold break-all">
                <span className="text-red-400 uppercase">URL:</span> {formData.url || window.location.href}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-8">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || submitStatus === 'success'}
              className="flex-1 bg-red-500 text-white py-6 px-8 border-4 border-white font-black text-lg uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REPORT'}
            </button>
            <button
              onClick={onClose}
              className="px-8 py-6 bg-gray-800 text-white border-4 border-white font-black text-lg uppercase tracking-wider hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-150"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;