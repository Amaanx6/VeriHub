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
  Globe
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

// In-memory cache instead of localStorage
let reportsCache: Report[] | null = null;
let cacheTimestamp: number = 0;
let sourceProfileCache: SourceProfileResponse | null = null;
let sourceProfileCacheTimestamp: number = 0;

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

const fetchSourceProfile = async (): Promise<SourceProfileResponse> => {
  try {
    // Check in-memory cache first
    const age = Date.now() - sourceProfileCacheTimestamp;
    if (sourceProfileCache && age < 10 * 60 * 1000) { // 10 minutes
      return sourceProfileCache;
    }
    
    // Fetch fresh data
    const response = await fetch(`${API_BASE_URL}/reports/source-profile`);
    const data = await response.json();
    
    if (data.success) {
      // Cache the results in memory
      sourceProfileCache = data;
      sourceProfileCacheTimestamp = Date.now();
      return data;
    }
    
    throw new Error('Failed to fetch source profile');
  } catch (error) {
    console.error('Error fetching source profile:', error);
    
    // Fallback to cache even if stale
    if (sourceProfileCache) {
      return sourceProfileCache;
    }
    
    throw error;
  }
};

// Source Pooling Card Component
const SourcePoolingCard: React.FC<{ sourceData: SourceProfileResponse | null }> = ({ sourceData }) => {
  const getTrustScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!sourceData) {
    return (
      <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Globe className="h-5 w-5 mr-2 text-purple-500" />
            Source Pooling
          </h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 bg-gray-700 rounded w-24"></div>
                <div className="h-4 bg-gray-700 rounded w-12"></div>
              </div>
              <div className="h-2 bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const topSources = sourceData.sources.slice(0, 4);

  return (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Globe className="h-5 w-5 mr-2 text-purple-500" />
          Source Pooling
        </h3>
        <div className="text-sm text-gray-400">
          {sourceData.total_entities_found} domains
        </div>
      </div>
      <div className="space-y-3">
        {topSources.map((source, index) => (
          <div key={source.domain} className="p-3 bg-gray-900/40 rounded-lg border border-gray-700/30">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-white truncate" title={source.domain}>
                  {source.domain}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {source.reportCount} reports
                </div>
              </div>
              <div className={`text-sm font-bold ${getTrustScoreColor(source.domainTrustScore)}`}>
                {source.domainTrustScore}
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  source.domainTrustScore >= 70 ? 'bg-emerald-500' :
                  source.domainTrustScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${source.domainTrustScore}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-700/50 text-xs text-gray-400">
        <div className="grid grid-cols-3 gap-2">
          <div>High Risk: {sourceData.summary.high_risk_sources}</div>
          <div>Medium: {sourceData.summary.medium_risk_sources}</div>
          <div>Low: {sourceData.summary.low_risk_sources}</div>
        </div>
      </div>
    </div>
  );
};

export default function GeneralLedger() {
  const [reports, setReports] = useState<Report[]>([]);
  const [sourceProfile, setSourceProfile] = useState<SourceProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [severityFilter, setSeverityFilter] = useState('All Severities');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [reportsData, sourceData] = await Promise.all([
          fetchReports(),
          fetchSourceProfile()
        ]);
        
        setReports(reportsData);
        setSourceProfile(sourceData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
    // Navigate to forensic dashboard with report ID
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
              <SourcePoolingCard sourceData={sourceProfile} />
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
                      className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-purple-500/30"
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
    </div>
  );
}