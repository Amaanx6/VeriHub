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
    setFormData(({prev}:any) => ({ ...prev, [name]: value }));
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
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
              !
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Report False Claim</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Flagged Content Preview */}
          {formData.flaggedContent && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">Flagged Content:</h3>
              <p className="text-sm text-red-700 break-words">
                "{formData.flaggedContent}"
              </p>
              {formData.reason && (
                <p className="text-xs text-red-600 mt-2">
                  <strong>Issue:</strong> {formData.reason}
                </p>
              )}
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">Report submitted successfully!</p>
              <p className="text-green-600 text-sm">Thank you for helping improve content accuracy.</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Failed to submit report</p>
              <p className="text-red-600 text-sm">Please try again or contact support.</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="misinformation">Misinformation</option>
                <option value="fake-news">Fake News</option>
                <option value="misleading">Misleading Content</option>
                <option value="factual-error">Factual Error</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the issue *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Please explain why you believe this content is false or misleading..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Additional Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Context (Optional)
              </label>
              <textarea
                name="additionalContext"
                value={formData.additionalContext}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Any additional information, sources, or context..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                name="userEmail"
                value={formData.userEmail}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="your@email.com (for follow-up)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Page Info */}
            <div className="p-3 bg-gray-50 rounded-md text-xs text-gray-600">
              <p><strong>Page:</strong> {formData.title || document.title}</p>
              <p className="break-all"><strong>URL:</strong> {formData.url || window.location.href}</p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || submitStatus === 'success'}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;