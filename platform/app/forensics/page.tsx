'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Download, 
  ExternalLink, 
  Search, 
  Filter,
  FileText,
  Hash,
  Code,
  Link as LinkIcon,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Clock,
  User,
  Eye,
  Zap,
  X
} from 'lucide-react';

// AnimatedSection component definition
interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, delay = 0, direction = 'up' }) => {
  const directions: Record<'up' | 'down' | 'left' | 'right', { opacity: number; x?: number; y?: number }> = {
    up: { opacity: 0, y: 20 },
    down: { opacity: 0, y: -20 },
    left: { opacity: 0, x: 20 },
    right: { opacity: 0, x: -20 }
  };

  return (
    <motion.div
      initial={directions[direction]}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
};

interface Report {
  id: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  title: string;
  flaggedContent: string;
  category: string;
  reason: string;
  description: string;
  severity: string;
  status: string;
  userEmail: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reportCount: number;
  timestamp: string;
}

interface ForensicData {
  metadata: {
    domain: string;
    firstSeen: string;
    lastSeen: string;
    contentHash: string;
    language: string;
    wordCount: number;
  };
  sourceAnalysis: {
    outboundLinks: Array<{
      url: string;
      trustScore: number;
      credibility: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    domainTrustScore: number;
  };
  aiSnapshot: {
    claims: string[];
    reasoning: string;
    severity: string;
    correction: string;
  };
  similarReports: number;
}

// In-memory cache instead of localStorage
let reportsCache: Report[] | null = null;
let cacheTimestamp: number = 0;

// API service functions
const API_BASE_URL = 'https://verihubbackend.vercel.app/api';

const fetchReports = async (): Promise<Report[]> => {
  try {
    // Check in-memory cache first
    const age = Date.now() - cacheTimestamp;
    if (reportsCache && age < 5 * 60 * 1000) { // 5 minutes
      return reportsCache;
    }
    
    // Fetch fresh data
    const response = await fetch(`${API_BASE_URL}/reports/list`);
    const data = await response.json();
    
    if (data.success) {
      // Cache the results in memory
      reportsCache = data.data;
      cacheTimestamp = Date.now();
      return data.data;
    }
    
    throw new Error('Failed to fetch reports');
  } catch (error) {
    console.error('Error fetching reports:', error);
    
    // Fallback to cache even if stale
    if (reportsCache) {
      return reportsCache;
    }
    
    throw error;
  }
};

// Generate forensic data from a report
const generateForensicData = (report: Report): ForensicData => {
  const domain = new URL(report.url).hostname;
  
  return {
    metadata: {
      domain,
      firstSeen: new Date(Date.parse(report.createdAt) - 24 * 60 * 60 * 1000).toISOString(),
      lastSeen: report.timestamp,
      contentHash: generateContentHash(report.flaggedContent + report.title),
      language: "en",
      wordCount: (report.flaggedContent + report.title + report.description).split(/\s+/).length
    },
    sourceAnalysis: {
      outboundLinks: generateOutboundLinks(report.url),
      domainTrustScore: calculateDomainTrustScore(domain)
    },
    aiSnapshot: {
      claims: report.flaggedContent.split(/[.!?]+/).filter(claim => claim.trim().length > 0),
      reasoning: report.reason,
      severity: report.severity,
      correction: generateCorrection(report.category, report.flaggedContent)
    },
    similarReports: Math.floor(Math.random() * 15) + 1
  };
};

// Helper functions for forensic data generation
const generateContentHash = (content: string): string => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

const generateOutboundLinks = (url: string): Array<{url: string, trustScore: number, credibility: 'HIGH' | 'MEDIUM' | 'LOW'}> => {
  const baseDomain = new URL(url).hostname;
  const links = [
    { url: "https://www.who.int/", trustScore: 92, credibility: "HIGH" as const },
    { url: "https://www.cdc.gov/", trustScore: 90, credibility: "HIGH" as const },
    { url: "https://www.reuters.com/", trustScore: 88, credibility: "HIGH" as const },
    { url: `https://${baseDomain}/related`, trustScore: 35, credibility: "LOW" as const },
    { url: "https://questionable-source.com", trustScore: 25, credibility: "LOW" as const }
  ];
  
  return links.sort(() => Math.random() - 0.5).slice(0, 3);
};

const calculateDomainTrustScore = (domain: string): number => {
  if (domain.includes('gov') || domain.includes('edu') || domain.includes('who.int') || domain.includes('cdc.gov')) {
    return 85 + Math.floor(Math.random() * 15);
  }
  if (domain.includes('news') || domain.includes('reuters') || domain.includes('apnews')) {
    return 75 + Math.floor(Math.random() * 15);
  }
  if (domain.includes('blog') || domain.includes('medium')) {
    return 50 + Math.floor(Math.random() * 25);
  }
  return 20 + Math.floor(Math.random() * 30);
};

const generateCorrection = (category: string, content: string): string => {
  const corrections: Record<string, string> = {
    MISINFORMATION: "This claim has been debunked by multiple reputable sources including the WHO and CDC. Always consult verified medical professionals for health advice.",
    FAKE_NEWS: "This story has been verified as false by multiple fact-checking organizations. No credible news sources have reported this event.",
    MISLEADING: "This content presents information in a misleading way that exaggerates or distorts the facts. Check primary sources for accurate information."
  };
  
  return corrections[category] || "This content contains inaccuracies. Please verify information through trusted sources before sharing.";
};

export default function ForensicsDemo() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [forensicData, setForensicData] = useState<ForensicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'general' | 'forensics'>('general');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [severityFilter, setSeverityFilter] = useState('All Severities');

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const reportsData = await fetchReports();
        setReports(reportsData);
        
        if (reportsData.length > 0) {
          const firstReport = reportsData[0];
          setSelectedReport(firstReport);
          setForensicData(generateForensicData(firstReport));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports');
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // Filter reports based on search and filter criteria
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = searchTerm === '' || 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.flaggedContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.url.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All Categories' || report.category === categoryFilter;
      const matchesSeverity = severityFilter === 'All Severities' || report.severity === severityFilter;
      
      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [reports, searchTerm, categoryFilter, severityFilter]);

  const handleReportSelect = (report: Report) => {
    setSelectedReport(report);
    setForensicData(generateForensicData(report));
    setActiveSection('forensics');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All Categories');
    setSeverityFilter('All Severities');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const exportReport = (format: 'pdf' | 'csv') => {
    if (!selectedReport) return;
    
    const dataStr = format === 'csv' 
      ? generateCSV(selectedReport, forensicData)
      : 'PDF content would be generated here';
    
    const blob = new Blob([dataStr], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verihub-report-${selectedReport.id.slice(0, 8)}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCSV = (report: Report, forensic: ForensicData | null): string => {
    const headers = ['Field', 'Value'];
    const rows = [
      ['ID', report.id],
      ['Title', report.title],
      ['URL', report.url],
      ['Flagged Content', report.flaggedContent],
      ['Category', report.category],
      ['Severity', report.severity],
      ['Reason', report.reason],
      ['Description', report.description],
      ['Report Count', report.reportCount.toString()],
      ['Created At', report.createdAt],
      ['Domain', forensic?.metadata.domain || ''],
      ['Content Hash', forensic?.metadata.contentHash || ''],
      ['Trust Score', forensic?.sourceAnalysis.domainTrustScore.toString() || ''],
    ];
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/50 rounded-2xl border border-red-500/20">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20" />
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-xl z-50 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Shield className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                VeriHub Forensics
              </span>
            </motion.div>
            <motion.div 
              className="flex space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <button
                onClick={() => setActiveSection('general')}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  activeSection === 'general' 
                    ? 'bg-purple-500 text-white shadow-lg' 
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                General Ledger
              </button>
              <button
                onClick={() => setActiveSection('forensics')}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  activeSection === 'forensics' 
                    ? 'bg-purple-500 text-white shadow-lg' 
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Forensic Analysis
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* General Ledger Section */}
      {activeSection === 'general' && (
        <section className="relative z-10 min-h-screen pt-16 pb-12">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6"
              >
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-purple-400 font-medium">
                  Misinformation Intelligence
                </span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Misinformation Reports
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Browse all reported misinformation instances with detailed forensic analysis and AI-powered insights
              </p>
            </div>
          </AnimatedSection>

          {/* Enhanced Filters */}
          <AnimatedSection delay={0.2}>
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-gray-700/50 shadow-2xl">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[300px]">
                  <label className="block text-sm text-gray-400 mb-2">Search Reports</label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors" />
                    <input 
                      id="search-reports"
                      name="search"
                      type="text" 
                      placeholder="Search reports, URLs, or content..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-300 placeholder-gray-500"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="category-filter" className="block text-sm text-gray-400 mb-2">Category</label>
                  <select 
                    id="category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-gray-700/50 border border-gray-600/50 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-300 min-w-[150px]"
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="MISINFORMATION">Misinformation</option>
                    <option value="FAKE_NEWS">Fake News</option>
                    <option value="MISLEADING">Misleading</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="severity-filter" className="block text-sm text-gray-400 mb-2">Severity</label>
                  <select 
                    id="severity-filter"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-gray-700/50 border border-gray-600/50 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-300 min-w-[150px]"
                  >
                    <option value="All Severities">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                  </select>
                </div>
                <motion.button 
                  onClick={clearFilters}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600/50 px-6 py-3 rounded-xl font-medium transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="h-5 w-5" />
                  <span>Clear Filters</span>
                </motion.button>
              </div>
              {(searchTerm !== '' || categoryFilter !== 'All Categories' || severityFilter !== 'All Severities') && (
                <div className="mt-4 text-sm text-gray-400">
                  Showing {filteredReports.length} of {reports.length} reports
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Stats Cards */}
          <AnimatedSection delay={0.3}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Reports', value: reports.length, icon: FileText, color: 'purple-500' },
                { label: 'Critical', value: reports.filter(r => r.severity === 'CRITICAL').length, icon: AlertTriangle, color: 'red-500' },
                { label: 'Verified', value: reports.filter(r => r.status === 'VERIFIED').length, icon: CheckCircle, color: 'emerald-500' },
                { label: 'Processing', value: reports.filter(r => r.status === 'PENDING').length, icon: Clock, color: 'yellow-500' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 text-${stat.color}`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>

          {/* Reports List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : (
            <AnimatedSection delay={0.4}>
              <div className="space-y-4">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800/40 rounded-2xl border border-gray-700/50">
                    <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No reports found</h3>
                    <p className="text-gray-400">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  filteredReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border cursor-pointer transition-all duration-300 hover:shadow-2xl ${
                        selectedReport?.id === report.id 
                          ? 'border-purple-500/70 shadow-lg' 
                          : 'border-gray-700/50 hover:border-purple-500/30'
                      }`}
                      onClick={() => handleReportSelect(report)}
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                            <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getSeverityColor(report.severity)}`}>
                              {report.severity}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-4">{report.flaggedContent}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(report.timestamp).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {report.userEmail || 'Anonymous'}
                            </span>
                            <span className="flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {report.reportCount} reports
                            </span>
                          </div>
                        </div>
                        <motion.button 
                          className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm font-medium px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReportSelect(report);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span>Analyze</span>
                          <ChevronRight className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>
        )}

      {/* Forensic Analysis Section */}
      {activeSection === 'forensics' && (
        <section className="relative z-10 min-h-screen pt-16 pb-12">
        
        {selectedReport && forensicData ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatedSection>
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6"
                >
                  <Code className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-400 font-medium">
                    AI-Powered Investigation
                  </span>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Forensic Analysis
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                  Deep technical analysis with AI-powered insights and source verification
                </p>
                <div className="flex justify-center space-x-4">
                  <motion.button 
                    onClick={() => exportReport('pdf')}
                    className="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 px-6 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FileText className="h-5 w-5" />
                    <span>Export PDF</span>
                  </motion.button>
                  <motion.button 
                    onClick={() => exportReport('csv')}
                    className="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 px-6 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="h-5 w-5" />
                    <span>Export CSV</span>
                  </motion.button>
                </div>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Report Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Report Summary */}
                <AnimatedSection delay={0.2}>
                  <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                    <h2 className="text-2xl font-semibold mb-6 flex items-center">
                      <AlertTriangle className="h-6 w-6 mr-3 text-purple-500" />
                      <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        Report Summary
                      </span>
                    </h2>
                    <div className="mb-6">
                      <h3 className="text-xl font-medium mb-3 text-white">{selectedReport.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{selectedReport.flaggedContent}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-400">Category</p>
                        <p className="font-semibold text-white">{selectedReport.category}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-400">Severity</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(selectedReport.severity)}`}>
                          {selectedReport.severity}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-400">Reported</p>
                        <p className="font-semibold text-white">{new Date(selectedReport.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-400">Times Reported</p>
                        <p className="font-semibold text-white">{selectedReport.reportCount}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-700/50">
                      <a 
                        href={selectedReport.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors"
                      >
                        <span>View Original Content</span>
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </div>
                  </div>
                </AnimatedSection>

                {/* AI Analysis Snapshot */}
                <AnimatedSection delay={0.3}>
                  <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                    <h2 className="text-2xl font-semibold mb-6 flex items-center">
                      <Code className="h-6 w-6 mr-3 text-blue-500" />
                      <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        AI Analysis Snapshot
                      </span>
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-white">Identified Claims</h3>
                        <ul className="space-y-2">
                          {forensicData.aiSnapshot.claims.map((claim, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-gray-300">{claim}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-white">AI Reasoning</h3>
                        <p className="text-gray-300 leading-relaxed">{forensicData.aiSnapshot.reasoning}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-white">Suggested Correction</h3>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                          <p className="text-emerald-200">{forensicData.aiSnapshot.correction}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>

              {/* Forensic Metadata */}
              <div className="space-y-8">
                {/* Content Fingerprinting */}
                <AnimatedSection delay={0.4} direction="right">
                  <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                    <h2 className="text-xl font-semibold mb-6 flex items-center">
                      <Hash className="h-5 w-5 mr-3 text-purple-500" />
                      <span className="text-purple-400">Content Fingerprinting</span>
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Content Hash</p>
                        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                          <p className="font-mono text-xs text-gray-300 break-all">
                            {forensicData.metadata.contentHash}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">First Seen</p>
                          <p className="font-medium text-white">{new Date(forensicData.metadata.firstSeen).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Last Seen</p>
                          <p className="font-medium text-white">{new Date(forensicData.metadata.lastSeen).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Language</p>
                          <p className="font-medium text-white">{forensicData.metadata.language.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Word Count</p>
                          <p className="font-medium text-white">{forensicData.metadata.wordCount}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Similar Reports</p>
                        <p className="font-medium text-blue-400">{forensicData.similarReports} matching patterns</p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                {/* Source Analysis */}
                <AnimatedSection delay={0.5} direction="right">
                  <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                    <h2 className="text-xl font-semibold mb-6 flex items-center">
                      <LinkIcon className="h-5 w-5 mr-3 text-blue-500" />
                      <span className="text-blue-400">Source Analysis</span>
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm text-gray-400">Domain Trust Score</p>
                          <span className={`font-bold ${getCredibilityColor(forensicData.sourceAnalysis.domainTrustScore)}`}>
                            {forensicData.sourceAnalysis.domainTrustScore}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <motion.div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full" 
                            initial={{ width: 0 }}
                            animate={{ width: `${forensicData.sourceAnalysis.domainTrustScore}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-3">Outbound Links</p>
                        <div className="space-y-3">
                          {forensicData.sourceAnalysis.outboundLinks.map((link, index) => (
                            <motion.div 
                              key={index} 
                              className="flex justify-between items-center p-3 bg-gray-900/40 rounded-lg border border-gray-700/30"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + index * 0.1 }}
                            >
                              <div className="truncate text-sm mr-3 flex-1 text-gray-300" title={link.url}>
                                {new URL(link.url).hostname}
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                link.credibility === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400' :
                                link.credibility === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {link.credibility}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-96">
            <AnimatedSection>
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Shield className="h-16 w-16 text-purple-500/50 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4 text-white">No Report Selected</h3>
                <p className="text-gray-400 mb-6">Select a report from the General Ledger to view detailed forensic analysis</p>
                <motion.button 
                  onClick={() => setActiveSection('general')}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-medium transition-all duration-300 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Browse Reports
                </motion.button>
              </div>
            </AnimatedSection>
          </div>
        )}
      </section>
      )}
    </div>
  );
}