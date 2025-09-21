'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  AlertTriangle, 
  Search, 
  Filter,
  FileText,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Clock,
  User,
  X,
  TrendingUp,
  Globe,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Activity,
  Zap
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

interface SourceData {
  domain: string;
  reportCount: number;
  severityBreakdown: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  firstReportedAt: string;
  lastReportedAt: string;
  domainTrustScore: number;
  tags: string[];
  topUrls: Array<{ url: string; reportCount: number }>;
  notes: string | null;
}

interface SourceProfileResponse {
  success: boolean;
  analysis_timestamp: string;
  total_reports_analyzed: number;
  total_entities_found: number;
  cross_referenced_entities: number;
  sources: SourceData[];
  summary: {
    high_risk_sources: number;
    medium_risk_sources: number;
    low_risk_sources: number;
    most_dangerous_entity: string | null;
  };
  query_parameters: {
    risk_threshold: number;
    entity_type: string;
    limit: number;
  };
}

// API service functions (removed caching)
const API_BASE_URL = 'https://verihubbackend.vercel.app/api';

const fetchReports = async (): Promise<Report[]> => {
  try {
    console.log('Fetching reports from:', `${API_BASE_URL}/reports/list`);
    const response = await fetch(`${API_BASE_URL}/reports/list`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Reports response:', data);
    
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    
    throw new Error(data.message || 'Invalid response format');
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

const fetchSourceProfile = async (): Promise<SourceProfileResponse> => {
  try {
    console.log('Fetching source profile from:', `${API_BASE_URL}/reports/source-profile`);
    const response = await fetch(`${API_BASE_URL}/reports/source-profile`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Source profile response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Source profile response:', data);
    
    if (data.success) {
      return data;
    }
    
    throw new Error(data.message || 'API returned unsuccessful response');
  } catch (error) {
    console.error('Error fetching source profile:', error);
    throw error;
  }
};

// Enhanced Source Pooling Card Component
const SourcePoolingCard: React.FC<{ 
  sourceData: SourceProfileResponse | null; 
  loading: boolean; 
  error: string | null; 
  onRefresh: () => void 
}> = ({ sourceData, loading, error, onRefresh }) => {
  const getTrustScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrustScoreBg = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    if (score >= 40) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    return 'bg-red-500/20 text-red-300 border-red-500/50';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Globe className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Source Intelligence</h3>
            <p className="text-sm text-gray-400">Domain risk analysis & tracking</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {sourceData && (
            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
              {formatTimeAgo(sourceData.analysis_timestamp)}
            </span>
          )}
          <motion.button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="text-red-300 font-medium">Failed to load source data</h4>
              <p className="text-red-200 text-sm mt-1">{error}</p>
              <button 
                onClick={onRefresh}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !sourceData && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-700 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-700 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-12"></div>
              </div>
              <div className="h-2 bg-gray-700 rounded w-full mb-2"></div>
              <div className="flex space-x-1">
                <div className="h-4 bg-gray-700 rounded w-12"></div>
                <div className="h-4 bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data State */}
      {sourceData && !loading && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <div className="text-xs text-gray-400 mb-1">Total Domains</div>
              <div className="text-lg font-bold text-white">{sourceData.total_entities_found}</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              <div className="text-xs text-red-400 mb-1">High Risk</div>
              <div className="text-lg font-bold text-red-300">{sourceData.summary.high_risk_sources}</div>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
              <div className="text-xs text-yellow-400 mb-1">Medium Risk</div>
              <div className="text-lg font-bold text-yellow-300">{sourceData.summary.medium_risk_sources}</div>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
              <div className="text-xs text-emerald-400 mb-1">Low Risk</div>
              <div className="text-lg font-bold text-emerald-300">{sourceData.summary.low_risk_sources}</div>
            </div>
          </div>

          {/* Top Sources */}
          {sourceData.sources && sourceData.sources.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300 mb-3">High-Risk Domains</h4>
              {sourceData.sources.slice(0, 6).map((source, index) => (
                <motion.div 
                  key={source.domain || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-900/40 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Activity className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-white truncate" title={source.domain}>
                          {source.domain || 'Unknown Domain'}
                        </span>
                        <ExternalLink className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span className="flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          {source.reportCount || 0} reports
                        </span>
                        <span>
                          Last seen: {source.lastReportedAt ? formatTimeAgo(source.lastReportedAt) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`text-sm font-bold ${getTrustScoreColor(source.domainTrustScore || 0)}`}>
                        {source.domainTrustScore || 0}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getRiskBadgeColor(source.domainTrustScore || 0)}`}>
                        {(source.domainTrustScore || 0) >= 70 ? 'Low Risk' : 
                         (source.domainTrustScore || 0) >= 40 ? 'Medium' : 'High Risk'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Trust Score Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getTrustScoreBg(source.domainTrustScore || 0)}`}
                      style={{ width: `${source.domainTrustScore || 0}%` }}
                    />
                  </div>

                  {/* Severity Breakdown */}
                  {source.severityBreakdown && (
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-red-400">
                        Critical: {source.severityBreakdown.CRITICAL || 0}
                      </div>
                      <div className="text-orange-400">
                        High: {source.severityBreakdown.HIGH || 0}
                      </div>
                      <div className="text-yellow-400">
                        Medium: {source.severityBreakdown.MEDIUM || 0}
                      </div>
                      <div className="text-gray-400">
                        Low: {source.severityBreakdown.LOW || 0}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {source.tags && source.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {source.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span 
                          key={tagIndex} 
                          className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                      {source.tags.length > 3 && (
                        <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                          +{source.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No domain data available</p>
            </div>
          )}

          {/* Most Dangerous Entity Alert */}
          {sourceData.summary.most_dangerous_entity && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-300 font-medium">
                  Highest Risk Domain: {sourceData.summary.most_dangerous_entity}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-700/50 text-xs text-gray-500">
            <div className="flex justify-between items-center">
              <span>Last analyzed: {new Date(sourceData.analysis_timestamp).toLocaleString()}</span>
              <span>{sourceData.total_reports_analyzed} reports analyzed</span>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!sourceData && !loading && !error && (
        <div className="text-center py-8">
          <Globe className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No source data available</p>
          <button 
            onClick={onRefresh}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            Load data
          </button>
        </div>
      )}
    </div>
  );
};

export default function GeneralLedger() {
  const [reports, setReports] = useState<Report[]>([]);
  const [sourceProfile, setSourceProfile] = useState<SourceProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceLoading, setSourceLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const router = useRouter();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [severityFilter, setSeverityFilter] = useState('All Severities');

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const reportsData = await fetchReports();
      setReports(reportsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSourceProfile = async () => {
    try {
      setSourceLoading(true);
      setSourceError(null);
      const sourceData = await fetchSourceProfile();
      setSourceProfile(sourceData);
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : 'Failed to load source profile');
      console.error('Error loading source profile:', err);
    } finally {
      setSourceLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    loadSourceProfile();
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
    router.push(`/forensics?reportId=${report.id}`);
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

  // Get unique categories and severities for filters
  const categories = ['All Categories', ...Array.from(new Set(reports.map(r => r.category)))];
  const severities = ['All Severities', ...Array.from(new Set(reports.map(r => r.severity)))];

  if (error && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/50 rounded-2xl border border-red-500/20">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={loadReports}
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
                VeriHub General Ledger
              </span>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
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
                General Ledger
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Browse all reported misinformation instances with detailed analysis and insights
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
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
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
                    {severities.map(severity => (
                      <option key={severity} value={severity}>{severity}</option>
                    ))}
                  </select>
                </div>
                <motion.button 
                  onClick={clearFilters}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600/50 px-6 py-3 rounded-xl font-medium transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="h-5 w-5" />
                  <span>Clear</span>
                </motion.button>
              </div>
              {(searchTerm !== '' || categoryFilter !== 'All Categories' || severityFilter !== 'All Severities') && (
                <div className="mt-4 text-sm text-gray-400">
                  Showing {filteredReports.length} of {reports.length} reports
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Source Pooling Card */}
          <AnimatedSection delay={0.25}>
            <div className="mb-8">
              <SourcePoolingCard 
                sourceData={sourceProfile}
                loading={sourceLoading}
                error={sourceError}
                onRefresh={loadSourceProfile}
              />
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
                  className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-${stat.color}/20`}>
                      <stat.icon className={`h-8 w-8 text-${stat.color}`} />
                    </div>
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Recent Reports</h2>
                  <motion.button 
                    onClick={loadReports}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </motion.button>
                </div>

                {filteredReports.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800/40 rounded-2xl border border-gray-700/50">
                    <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No reports found</h3>
                    <p className="text-gray-400 mb-4">
                      {reports.length === 0 
                        ? "No reports available at the moment" 
                        : "Try adjusting your search or filters"
                      }
                    </p>
                    {reports.length === 0 && (
                      <button 
                        onClick={loadReports}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                      >
                        Load Reports
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Quick Stats for Filtered Results */}
                    {(searchTerm || categoryFilter !== 'All Categories' || severityFilter !== 'All Severities') && (
                      <div className="bg-gray-800/30 rounded-xl p-4 mb-4 border border-gray-700/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-white">{filteredReports.length}</div>
                            <div className="text-xs text-gray-400">Filtered Results</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-400">
                              {filteredReports.filter(r => r.severity === 'CRITICAL').length}
                            </div>
                            <div className="text-xs text-gray-400">Critical</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-400">
                              {filteredReports.filter(r => r.severity === 'HIGH').length}
                            </div>
                            <div className="text-xs text-gray-400">High</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-yellow-400">
                              {filteredReports.filter(r => r.severity === 'MEDIUM').length}
                            </div>
                            <div className="text-xs text-gray-400">Medium</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reports List */}
                    {filteredReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 1) }}
                        className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-purple-500/30 hover:bg-gray-800/60"
                        onClick={() => handleReportSelect(report)}
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold text-white leading-tight pr-4">
                                {report.title}
                              </h3>
                              <span className={`text-xs px-3 py-1 rounded-full border font-medium whitespace-nowrap ${getSeverityColor(report.severity)}`}>
                                {report.severity}
                              </span>
                            </div>
                            
                            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                              {report.flaggedContent}
                            </p>

                            <div className="mb-3 text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg inline-block">
                              <span className="font-mono">{report.url}</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(report.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {report.userEmail || 'Anonymous'}
                              </span>
                              <span className="flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {report.reportCount} report{report.reportCount !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center">
                                <Filter className="h-3 w-3 mr-1" />
                                {report.category}
                              </span>
                              {report.status && (
                                <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  report.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' :
                                  report.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {report.status}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <motion.div 
                            className="flex lg:flex-col gap-2 lg:items-end"
                            whileHover={{ scale: 1.02 }}
                          >
                            <motion.button 
                              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm font-medium px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-300 whitespace-nowrap"
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
                            
                            {report.reviewedAt && (
                              <div className="text-xs text-gray-500">
                                <div>Reviewed</div>
                                <div>{new Date(report.reviewedAt).toLocaleDateString()}</div>
                              </div>
                            )}
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Load More Button (if there are many reports) */}
                    {filteredReports.length > 50 && (
                      <div className="text-center pt-6">
                        <div className="text-sm text-gray-400 mb-4">
                          Showing first 50 results. Use filters to narrow down your search.
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </AnimatedSection>
          )}

          {/* Footer Information */}
          <AnimatedSection delay={0.6}>
            <div className="mt-12 pt-8 border-t border-gray-700/50">
              <div className="text-center text-sm text-gray-500">
                <div className="flex justify-center items-center space-x-6">
                  <div>Total Reports: {reports.length}</div>
                  <div>•</div>
                  <div>Last Updated: {new Date().toLocaleDateString()}</div>
                  <div>•</div>
                  <div>API Status: {error ? '🔴 Error' : '🟢 Online'}</div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}