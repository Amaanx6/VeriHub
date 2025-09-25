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
  RefreshCw,
  Globe,
  ExternalLink,
  Users,
  Crosshair
} from 'lucide-react';
import SourcePoolingCard, { useSourcePooling, SourceProfileResponse } from './sourcepooling';

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

// API service functions
const API_BASE_URL = 'https://verihubbackend.vercel.app/api';

const fetchReports = async (): Promise<Report[]> => {
  try {
    const timestamp = Date.now();
    console.log('Fetching reports from:', `${API_BASE_URL}/reports/list?t=${timestamp}`);
    const response = await fetch(`${API_BASE_URL}/reports/list?t=${timestamp}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Reports response:', JSON.stringify(data, null, 2));
    
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    
    throw new Error(data.message || 'Invalid response format');
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

// Create a function to transform source entity data into report-like format for display
const transformSourceDataToReports = (sourceData: SourceProfileResponse | null): any[] => {
  if (!sourceData || !sourceData.sources || sourceData.sources.length === 0) {
    return [];
  }

  return sourceData.sources.map((entity, index) => ({
    id: `entity-${entity.type}-${index}`,
    entityType: entity.type,
    entityValue: entity.value,
    linkedReports: entity.linked_reports,
    totalReportCount: entity.total_report_count,
    riskScore: entity.risk_score,
    severityBreakdown: entity.severity_breakdown,
    firstSeen: entity.first_seen,
    lastSeen: entity.last_seen,
    insights: entity.insights,
    // Add fields to match Report interface for display
    title: `${entity.type.replace('_', ' ').toUpperCase()} Analysis: ${entity.value}`,
    flaggedContent: `Entity appears in ${entity.linked_reports} reports with ${entity.total_report_count} total mentions. Risk score: ${entity.risk_score}/10`,
    category: 'ENTITY_ANALYSIS',
    severity: entity.risk_score >= 7 ? 'CRITICAL' : entity.risk_score >= 4 ? 'HIGH' : 'MEDIUM',
    status: 'ANALYZED',
    timestamp: entity.last_seen,
    isEntityData: true // Flag to identify this as entity data
  }));
};

export default function GeneralLedger() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Use the source pooling hook
  const { sourceProfile, loading: sourceLoading, error: sourceError, loadSourceProfile } = useSourcePooling();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [dataView, setDataView] = useState<'reports' | 'entities'>('reports');

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

  useEffect(() => {
    loadReports();
    loadSourceProfile();
  }, []);

  // Transform source data for display in Recent Reports
  const entityReports = useMemo(() => {
    return transformSourceDataToReports(sourceProfile);
  }, [sourceProfile]);

  // Decide which data to show based on dataView and availability
  const displayData = dataView === 'entities' && entityReports.length > 0 ? entityReports : reports;
  const isShowingEntities = dataView === 'entities' && entityReports.length > 0;

  // Filter data based on search and filter criteria
  const filteredData = useMemo(() => {
    return displayData.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.flaggedContent && item.flaggedContent.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.entityValue && item.entityValue.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.url && item.url.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'All Categories' || 
        (item.category === categoryFilter) ||
        (isShowingEntities && categoryFilter === 'ENTITY_ANALYSIS');
      
      const matchesSeverity = severityFilter === 'All Severities' || item.severity === severityFilter;
      
      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [displayData, searchTerm, categoryFilter, severityFilter, isShowingEntities]);

  const handleItemSelect = (item: any) => {
    if (item.isEntityData) {
      // Handle entity data click - show entity details
      console.log('Selected entity:', item.entityValue);
      // You could implement a modal or detailed view here
    } else {
      router.push(`/forensics?reportId=${item.id}`);
    }
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'domain': return <Globe className="h-4 w-4" />;
      case 'phone': return <Users className="h-4 w-4" />;
      case 'email': return <FileText className="h-4 w-4" />;
      case 'bank_account': return <Shield className="h-4 w-4" />;
      case 'upi': return <Crosshair className="h-4 w-4" />;
      case 'social_handle': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'domain': return 'text-purple-400';
      case 'phone': return 'text-blue-400';
      case 'email': return 'text-green-400';
      case 'bank_account': return 'text-red-400';
      case 'upi': return 'text-orange-400';
      case 'social_handle': return 'text-pink-400';
      default: return 'text-gray-400';
    }
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
  const categories = ['All Categories', ...Array.from(new Set(displayData.map(r => r.category)))];
  const severities = ['All Severities', ...Array.from(new Set(displayData.map(r => r.severity)))];

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
                  <label className="block text-sm text-gray-400 mb-2">
                    {isShowingEntities ? 'Search Entities' : 'Search Reports'}
                  </label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors" />
                    <input 
                      id="search-data"
                      name="search"
                      type="text" 
                      placeholder={isShowingEntities ? 'Search entities or analysis...' : 'Search reports, URLs, or content...'} 
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
                  Showing {filteredData.length} of {displayData.length} {isShowingEntities ? 'entities' : 'reports'}
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

          {/* Stats Cards - Updated for entities */}
          <AnimatedSection delay={0.3}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {(isShowingEntities ? [
                { label: 'Total Entities', value: sourceProfile?.total_entities_found || 0, icon: Globe, color: 'purple-500' },
                { label: 'High Risk', value: sourceProfile?.summary?.high_risk_sources || 0, icon: AlertTriangle, color: 'red-500' },
                { label: 'Reports Analyzed', value: sourceProfile?.total_reports_analyzed || 0, icon: FileText, color: 'emerald-500' },
                { label: 'Cross-referenced', value: sourceProfile?.cross_referenced_entities || 0, icon: RefreshCw, color: 'yellow-500' },
              ] : [
                { label: 'Total Reports', value: reports.length, icon: FileText, color: 'purple-500' },
                { label: 'Critical', value: reports.filter(r => r.severity === 'CRITICAL').length, icon: AlertTriangle, color: 'red-500' },
                { label: 'Verified', value: reports.filter(r => r.status === 'VERIFIED').length, icon: CheckCircle, color: 'emerald-500' },
                { label: 'Processing', value: reports.filter(r => r.status === 'PENDING').length, icon: Clock, color: 'yellow-500' },
              ]).map((stat, index) => (
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

          {/* Data List - Updated for entities */}
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
                  <h2 className="text-2xl font-bold text-white">
                    {isShowingEntities ? 'Entity Analysis' : 'Recent Reports'}
                  </h2>
                  <motion.button 
                    onClick={isShowingEntities ? loadSourceProfile : loadReports}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </motion.button>
                </div>

                {filteredData.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800/40 rounded-2xl border border-gray-700/50">
                    <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {isShowingEntities ? 'No entities found' : 'No reports found'}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {displayData.length === 0 
                        ? `No ${isShowingEntities ? 'entity data' : 'reports'} available at the moment` 
                        : "Try adjusting your search or filters"
                      }
                    </p>
                    {displayData.length === 0 && (
                      <button 
                        onClick={isShowingEntities ? loadSourceProfile : loadReports}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                      >
                        Load {isShowingEntities ? 'Entity Data' : 'Reports'}
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
                            <div className="text-2xl font-bold text-white">{filteredData.length}</div>
                            <div className="text-xs text-gray-400">Filtered Results</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-400">
                              {filteredData.filter(r => r.severity === 'CRITICAL').length}
                            </div>
                            <div className="text-xs text-gray-400">Critical</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-400">
                              {filteredData.filter(r => r.severity === 'HIGH').length}
                            </div>
                            <div className="text-xs text-gray-400">High</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-yellow-400">
                              {filteredData.filter(r => r.severity === 'MEDIUM').length}
                            </div>
                            <div className="text-xs text-gray-400">Medium</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Data List */}
                    {filteredData.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 1) }}
                        className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-purple-500/30 hover:bg-gray-800/60"
                        onClick={() => handleItemSelect(item)}
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold text-white leading-tight pr-4">
                                {item.title}
                              </h3>
                              <span className={`text-xs px-3 py-1 rounded-full border font-medium whitespace-nowrap ${getSeverityColor(item.severity)}`}>
                                {item.severity}
                              </span>
                            </div>
                            
                            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                              {item.flaggedContent}
                            </p>

                            {/* Entity-specific display */}
                            {item.isEntityData ? (
                              <div className="mb-3 flex items-center space-x-2">
                                <div className={`p-2 rounded-lg ${getEntityTypeColor(item.entityType)} bg-gray-700/50`}>
                                  {getEntityTypeIcon(item.entityType)}
                                </div>
                                <div className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg">
                                  <span className="font-mono">{item.entityValue}</span>
                                  <span className="ml-2 text-gray-400 capitalize">{item.entityType.replace('_', ' ')}</span>
                                </div>
                              </div>
                            ) : item.url ? (
                              <div className="mb-3 text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg inline-block">
                                <span className="font-mono">{item.url}</span>
                              </div>
                            ) : null}
                            
                            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(item.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              
                              {/* Entity-specific stats */}
                              {item.isEntityData ? (
                                <>
                                  <span className="flex items-center">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {item.linkedReports} linked reports
                                  </span>
                                  <span className="flex items-center">
                                    <Users className="h-3 w-3 mr-1" />
                                    {item.totalReportCount} total mentions
                                  </span>
                                  <span className="flex items-center">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Risk: {item.riskScore}/10
                                  </span>
                                </>
                              ) : (
                                <>
                                  {item.userEmail && (
                                    <span className="flex items-center">
                                      <User className="h-3 w-3 mr-1" />
                                      {item.userEmail || 'Anonymous'}
                                    </span>
                                  )}
                                  {item.reportCount && (
                                    <span className="flex items-center">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      {item.reportCount} report{item.reportCount !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </>
                              )}
                              
                              <span className="flex items-center">
                                <Filter className="h-3 w-3 mr-1" />
                                {item.category}
                              </span>
                              
                              {item.status && (
                                <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === 'VERIFIED' || item.status === 'ANALYZED' ? 'bg-emerald-500/20 text-emerald-300' :
                                  item.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {item.status}
                                </span>
                              )}
                            </div>

                            {/* Entity insights */}
                            {item.isEntityData && item.insights && item.insights.length > 0 && (
                              <div className="mt-3">
                                <div className="text-xs text-gray-400 mb-1">Key Insights:</div>
                                <div className="space-y-1">
                                  {item.insights.slice(0, 2).map((insight: string, insightIndex: number) => (
                                    <div key={insightIndex} className="text-xs text-gray-300 bg-gray-700/30 px-2 py-1 rounded">
                                      • {insight}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Domain-specific info for backward compatibility */}
                            {item.domainTrustScore && (
                              <div className="mt-3 flex items-center space-x-4 text-xs">
                                <span className="text-gray-400">Trust Score: <strong>{item.domainTrustScore}/100</strong></span>
                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {item.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                                      <span key={tagIndex} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <motion.div 
                            className="flex lg:flex-col gap-2 lg:items-end"
                            whileHover={{ scale: 1.02 }}
                          >
                            <motion.button 
                              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm font-medium px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-300 whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemSelect(item);
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span>{isShowingEntities ? 'View Details' : 'Analyze'}</span>
                              <ChevronRight className="h-4 w-4" />
                            </motion.button>
                            
                            {item.reviewedAt && (
                              <div className="text-xs text-gray-500">
                                <div>Reviewed</div>
                                <div>{new Date(item.reviewedAt).toLocaleDateString('en-US')}</div>
                              </div>
                            )}
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Load More Button (if there are many items) */}
                    {filteredData.length > 50 && (
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
                  <div>Total {isShowingEntities ? 'Entities' : 'Reports'}: {displayData.length}</div>
                  <div>•</div>
                  <div>Last Updated: {new Date().toLocaleDateString('en-US')}</div>
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