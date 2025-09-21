import { useState } from 'react';

interface ReportFormProps {
  isVisible: boolean;
  onClose: () => void;
  reportData?: any;
}

const ReportForm = ({ 
  isVisible, 
  onClose, 
  reportData = {} 
}: ReportFormProps) => {
  const [formData, setFormData] = useState({
    category: 'MISINFORMATION',
    description: '',
    additionalContext: '',
    userEmail: '',
    flaggedContent: '',
    reason: '',
    correction: '',
    severity: 'MEDIUM',
    url: '',
    title: '',
    ...reportData
  });

  // Auto-generate description when other fields change
  const generateDescription = () => {
    const parts = [];
    
    if (formData.flaggedContent.trim()) {
      parts.push(`This content contains: "${formData.flaggedContent.trim()}"`);
    }
    
    if (formData.reason.trim()) {
      parts.push(`Issue identified: ${formData.reason.trim()}`);
    }
    
    if (formData.correction.trim()) {
      parts.push(`Correct information: ${formData.correction.trim()}`);
    }
    
    if (formData.category && formData.category !== 'OTHER') {
      parts.push(`Categorized as: ${formData.category.toLowerCase().replace('_', ' ')}`);
    }
    
    return parts.join('. ');
  };

  const handleAutoFill = () => {
    const autoDescription = generateDescription();
    if (autoDescription && !formData.description.trim()) {
      setFormData((prev: any) => ({ ...prev, description: autoDescription }));
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [responseData, setResponseData] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      alert('Please describe the issue before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('');
    setResponseData(null);

    try {
      // Prepare the complete report payload - matching your working Postman request
      const reportPayload = {
        url: formData.url || (typeof window !== 'undefined' ? window.location.href : ''),
        title: formData.title || (typeof document !== 'undefined' ? document.title : ''),
        flaggedContent: formData.flaggedContent,
        reason: formData.reason,
        correction: formData.correction,
        severity: String(formData.severity).toUpperCase().trim(), // Ensure it's a clean string
        category: String(formData.category).toUpperCase().trim(), // Ensure it's a clean string
        description: formData.description,
        additionalContext: formData.additionalContext
      };

      // Validate severity before sending
      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validSeverities.includes(reportPayload.severity)) {
        console.error('Invalid severity detected:', reportPayload.severity);
        reportPayload.severity = 'MEDIUM'; // Fallback to MEDIUM
      }

      // Validate category before sending
      const validCategories = ['MISINFORMATION', 'FAKE_NEWS', 'MISLEADING', 'FACTUAL_ERROR', 'OTHER'];
      if (!validCategories.includes(reportPayload.category)) {
        console.error('Invalid category detected:', reportPayload.category);
        reportPayload.category = 'MISINFORMATION'; // Fallback to MISINFORMATION
      }

      // Remove empty optional fields to match Postman behavior
      Object.keys(reportPayload).forEach(key => {
        if (reportPayload[key as keyof typeof reportPayload] === '' || 
            reportPayload[key as keyof typeof reportPayload] === null || 
            reportPayload[key as keyof typeof reportPayload] === undefined) {
          delete reportPayload[key as keyof typeof reportPayload];
        }
      });

      console.log('Sending payload:', reportPayload);

      const response = await fetch('https://verihubbackend.vercel.app/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(reportPayload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        setSubmitStatus('success');
        setResponseData(data);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
          onClose();
        }, 5000);
      } else {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(`Server responded with status: ${response.status} - ${JSON.stringify(errorData)}`);
      }

    } catch (error: any) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

        {/* Success Status */}
        {submitStatus === 'success' && (
          <div className="mb-6 bg-green-400 text-black p-6 border-4 border-white">
            <div className="text-center">
              <div className="w-16 h-16 bg-black text-green-400 flex items-center justify-center font-black text-3xl mx-auto mb-4 transform rotate-12">
                ✓
              </div>
              <p className="font-black text-2xl uppercase mb-2">THANK YOU FOR REPORTING!</p>
              <p className="font-bold text-lg mb-4">YOUR REPORT WILL HELP MAKE THE INTERNET A SAFER PLACE FOR ALL</p>
              
              <div className="bg-black text-green-400 p-4 border-2 border-green-600 mb-4">
                {responseData?.isUpdate ? (
                  <div>
                    <p className="font-black uppercase">DUPLICATE DETECTED - COUNT UPDATED</p>
                    <p className="text-sm mt-1">This content now has {responseData.data?.reportCount} reports</p>
                  </div>
                ) : (
                  <p className="font-black uppercase">FORENSIC ANALYSIS INITIATED</p>
                )}
                <p className="text-xs mt-2 opacity-75">Report ID: {responseData?.reportId}</p>
              </div>
              
              <p className="text-sm font-bold">
                🛡️ FIGHTING MISINFORMATION TOGETHER 🛡️
              </p>
            </div>
          </div>
        )}

        {/* Error Status */}
        {submitStatus === 'error' && (
          <div className="mb-6 bg-red-500 text-white p-6 border-4 border-white">
            <p className="font-black text-lg uppercase">SUBMISSION FAILED</p>
            <p className="font-bold">CHECK CONNECTION & RETRY</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Category - Required Field */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide text-red-400">
              CATEGORY * (REQUIRED)
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full p-4 bg-white text-black border-4 border-red-500 font-bold uppercase tracking-wide focus:border-red-600 focus:outline-none"
            >
              <option value="MISINFORMATION">MISINFORMATION</option>
              <option value="FAKE_NEWS">FAKE NEWS</option>
              <option value="MISLEADING">MISLEADING CONTENT</option>
              <option value="FACTUAL_ERROR">FACTUAL ERROR</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide">
              SEVERITY LEVEL
            </label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleInputChange}
              className="w-full p-4 bg-white text-black border-4 border-gray-800 font-bold uppercase tracking-wide focus:border-red-500 focus:outline-none"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Flagged Content */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide">
              FLAGGED CONTENT
            </label>
            <textarea
              name="flaggedContent"
              value={formData.flaggedContent}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="COPY THE SPECIFIC FALSE/MISLEADING TEXT HERE..."
              rows={3}
              className="w-full p-4 bg-white text-black border-4 border-gray-800 font-bold resize-none focus:border-red-500 focus:outline-none placeholder:text-gray-600 placeholder:font-bold"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide">
              REASON FOR REPORTING
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="BRIEF REASON WHY THIS IS PROBLEMATIC..."
              className="w-full p-4 bg-white text-black border-4 border-gray-800 font-bold focus:border-red-500 focus:outline-none placeholder:text-gray-600 placeholder:font-bold"
            />
          </div>

          {/* Description - Required Field */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide text-red-400">
              ISSUE DESCRIPTION * (REQUIRED)
            </label>
            <div className="flex space-x-2 mb-2">
              <button
                type="button"
                onClick={handleAutoFill}
                className="px-4 py-2 bg-blue-500 text-white font-bold uppercase text-xs border-2 border-white hover:bg-blue-600 transform hover:scale-105 transition-all duration-150"
              >
                AUTO-FILL FROM ABOVE
              </button>
              {formData.description && (
                <button
                  type="button"
                  onClick={() => setFormData((prev: any) => ({ ...prev, description: '' }))}
                  className="px-4 py-2 bg-gray-600 text-white font-bold uppercase text-xs border-2 border-white hover:bg-gray-700 transform hover:scale-105 transition-all duration-150"
                >
                  CLEAR
                </button>
              )}
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="DESCRIBE WHY THIS CONTENT IS PROBLEMATIC OR MISLEADING..."
              rows={6}
              required
              className="w-full p-4 bg-white text-black border-4 border-red-500 font-bold resize-none focus:border-red-600 focus:outline-none placeholder:text-gray-600 placeholder:font-bold"
            />
          </div>

          {/* Correction */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide">
              CORRECT INFORMATION
            </label>
            <textarea
              name="correction"
              value={formData.correction}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="PROVIDE THE ACCURATE INFORMATION..."
              rows={4}
              className="w-full p-4 bg-white text-black border-4 border-gray-800 font-bold resize-none focus:border-red-500 focus:outline-none placeholder:text-gray-600 placeholder:font-bold"
            />
          </div>

          {/* Additional Context */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide">
              SUPPORTING INFORMATION
            </label>
            <textarea
              name="additionalContext"
              value={formData.additionalContext}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="SOURCES, LINKS, OR OTHER RELEVANT DETAILS..."
              rows={4}
              className="w-full p-4 bg-white text-black border-4 border-gray-800 font-bold resize-none focus:border-red-500 focus:outline-none placeholder:text-gray-600 placeholder:font-bold"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide">
              CONTACT EMAIL (OPTIONAL)
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

          {/* URL Override - Required Field */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide text-red-400">
              REPORTED URL * (REQUIRED)
            </label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="ENTER THE URL YOU'RE REPORTING"
              required
              className="w-full p-4 bg-white text-black border-4 border-red-500 font-bold focus:border-red-600 focus:outline-none placeholder:text-gray-600 placeholder:font-bold"
            />
          </div>

          {/* Title Override - Required Field */}
          <div>
            <label className="block font-black text-lg uppercase mb-4 tracking-wide text-red-400">
              PAGE TITLE * (REQUIRED)
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="ENTER THE PAGE TITLE"
              required
              className="w-full p-4 bg-white text-black border-4 border-red-500 font-bold focus:border-red-600 focus:outline-none placeholder:text-gray-600 placeholder:font-bold"
            />
          </div>

          {/* Page Info */}
          <div className="bg-gray-800 p-6 border-4 border-white">
            <h3 className="font-black text-lg uppercase mb-4 tracking-wide">REPORT SUMMARY</h3>
            <div className="space-y-2">
              <p className="font-bold break-words">
                <span className="text-red-400 uppercase">TITLE:</span> {formData.title || 'NOT SET'}
              </p>
              <p className="font-bold break-all">
                <span className="text-red-400 uppercase">URL:</span> {formData.url || 'NOT SET'}
              </p>
              <p className="font-bold">
                <span className="text-red-400 uppercase">CATEGORY:</span> {formData.category}
              </p>
              <p className="font-bold">
                <span className="text-red-400 uppercase">SEVERITY:</span> {formData.severity}
              </p>
            </div>
          </div>

          {/* Validation Warning */}
          {(!formData.url || !formData.title || !formData.description) && (
            <div className="bg-yellow-500 text-black p-4 border-4 border-white">
              <p className="font-black uppercase">⚠️ MISSING REQUIRED FIELDS</p>
              <div className="mt-2 space-y-1">
                {!formData.url && <p className="font-bold">• URL is required</p>}
                {!formData.title && <p className="font-bold">• Title is required</p>}
                {!formData.description && <p className="font-bold">• Issue description is required</p>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-8">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || submitStatus === 'success' || !formData.url || !formData.title || !formData.description}
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