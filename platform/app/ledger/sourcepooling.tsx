'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Activity,
  Zap,
  AlertTriangle,
  FileText,
  Shield,
  Users,
  Crosshair
} from 'lucide-react';

// Interfaces for Source Pooling - UPDATED TO MATCH BACKEND
interface SourceEntity {
  type: string;
  value: string;
  linked_reports: number;
  total_report_count: number;
  risk_score: number;
  first_seen: string;
  last_seen: string;
  severity_breakdown: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  category_breakdown: Record<string, number>;
  insights: string[];
}

export interface SourceProfileResponse {
  success: boolean;
  analysis_timestamp: string;
  total_reports_analyzed: number;
  total_entities_found: number;
  cross_referenced_entities: number;
  sources: SourceEntity[];
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

// API service function for source pooling
const API_BASE_URL = 'https://verihubbackend.vercel.app/api';

const fetchSourceProfile = async (): Promise<SourceProfileResponse> => {
  try {
    const timestamp = Date.now();
    console.log('Fetching source profile from:', `${API_BASE_URL}/reports/source-profile?t=${timestamp}`);
    const response = await fetch(`${API_BASE_URL}/reports/source-profile?t=${timestamp}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    
    console.log('Source profile response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Source profile response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      return data;
    }
    
    throw new Error(data.message || 'API returned unsuccessful response');
  } catch (error) {
    console.error('Error fetching source profile:', error);
    throw error;
  }
};

// Source Pooling Card Component
interface SourcePoolingCardProps {
  sourceData: SourceProfileResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const SourcePoolingCard: React.FC<SourcePoolingCardProps> = ({ sourceData, loading, error, onRefresh }) => {
  const getRiskScoreColor = (score: number) => {
    if (score >= 7) return 'text-red-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const getRiskScoreBg = (score: number) => {
    if (score >= 7) return 'bg-red-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 7) return 'bg-red-500/20 text-red-300 border-red-500/50';
    if (score >= 4) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 7) return 'High Risk';
    if (score >= 4) return 'Medium Risk';
    return 'Low Risk';
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'domain': return <Globe className="h-4 w-4" />;
      case 'phone': return <Users className="h-4 w-4" />;
      case 'email': return <FileText className="h-4 w-4" />;
      case 'bank_account': return <Shield className="h-4 w-4" />;
      case 'upi': return <Crosshair className="h-4 w-4" />;
      case 'social_handle': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
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

  const formatTimeAgo = (timestamp: string) => {
    try {
      const now = new Date();
      const then = new Date(timestamp);
      if (isNaN(then.getTime())) {
        return 'Invalid date';
      }
      const diffMs = now.getTime() - then.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Unknown';
    }
  };

  // Check if we have actual source data or just empty response
  const hasSourceData = sourceData && sourceData.sources && sourceData.sources.length > 0;
  const hasReportsAnalyzed = sourceData && sourceData.total_reports_analyzed > 0;

  return (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Globe className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Entity Intelligence</h3>
            <p className="text-sm text-gray-400">Cross-referenced entity analysis</p>
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
              <h4 className="text-red-300 font-medium">Failed to load entity data</h4>
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
          {[...Array(3)].map((_, i) => (
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

      {/* Data State - Show even if sources are empty but we have analysis data */}
      {sourceData && !loading && (
        <>
          {/* Analysis Overview */}
          <div className="mb-6 p-4 bg-gray-900/40 rounded-lg border border-gray-700/30">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="h-5 w-5 text-purple-400" />
              <h4 className="text-lg font-semibold text-white">Analysis Overview</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{sourceData.total_reports_analyzed}</div>
                <div className="text-xs text-gray-400">Reports Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{sourceData.total_entities_found}</div>
                <div className="text-xs text-gray-400">Entities Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{sourceData.cross_referenced_entities}</div>
                <div className="text-xs text-gray-400">Cross-referenced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{sourceData.sources?.length || 0}</div>
                <div className="text-xs text-gray-400">High-Risk Entities</div>
              </div>
            </div>
          </div>

          {/* Summary Stats - Show even if zero */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
              <div className="text-xs text-gray-400 mb-1">Total Entities</div>
              <div className="text-lg font-bold text-white">{sourceData.total_entities_found || 0}</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              <div className="text-xs text-red-400 mb-1">High Risk</div>
              <div className="text-lg font-bold text-red-300">{sourceData.summary?.high_risk_sources || 0}</div>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
              <div className="text-xs text-yellow-400 mb-1">Medium Risk</div>
              <div className="text-lg font-bold text-yellow-300">{sourceData.summary?.medium_risk_sources || 0}</div>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
              <div className="text-xs text-emerald-400 mb-1">Low Risk</div>
              <div className="text-lg font-bold text-emerald-300">{sourceData.summary?.low_risk_sources || 0}</div>
            </div>
          </div>

          {/* Entity Sources - Show message if empty */}
          {hasSourceData ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300 mb-3">High-Risk Entities</h4>
              {sourceData.sources.slice(0, 6).map((entity, index) => (
                <motion.div 
                  key={`${entity.type}-${entity.value}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gray-900/40 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`p-1 rounded ${getEntityTypeColor(entity.type)}`}>
                          {getEntityTypeIcon(entity.type)}
                        </div>
                        <span className="text-sm font-medium text-white truncate" title={entity.value}>
                          {entity.value}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${getEntityTypeColor(entity.type)} bg-gray-700/50`}>
                          {entity.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span className="flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          {entity.linked_reports} linked reports
                        </span>
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {entity.total_report_count} total mentions
                        </span>
                        <span>
                          Last seen: {formatTimeAgo(entity.last_seen)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`text-sm font-bold ${getRiskScoreColor(entity.risk_score)}`}>
                        {entity.risk_score}/10
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getRiskBadgeColor(entity.risk_score)}`}>
                        {getRiskLevel(entity.risk_score)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Risk Score Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getRiskScoreBg(entity.risk_score)}`}
                      style={{ width: `${entity.risk_score * 10}%` }}
                    />
                  </div>

                  {/* Severity Breakdown */}
                  {entity.severity_breakdown && (
                    <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                      <div className="text-red-400">
                        Critical: {entity.severity_breakdown.CRITICAL || 0}
                      </div>
                      <div className="text-orange-400">
                        High: {entity.severity_breakdown.HIGH || 0}
                      </div>
                      <div className="text-yellow-400">
                        Medium: {entity.severity_breakdown.MEDIUM || 0}
                      </div>
                      <div className="text-gray-400">
                        Low: {entity.severity_breakdown.LOW || 0}
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  {entity.insights && entity.insights.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 mb-1">Insights:</div>
                      <div className="space-y-1">
                        {entity.insights.slice(0, 2).map((insight, insightIndex) => (
                          <div key={insightIndex} className="text-xs text-gray-300 bg-gray-700/30 px-2 py-1 rounded">
                            • {insight}
                          </div>
                        ))}
                        {entity.insights.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{entity.insights.length - 2} more insights
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No cross-referenced entities identified yet</p>
              <p className="text-sm text-gray-500">
                {hasReportsAnalyzed 
                  ? `${sourceData.total_reports_analyzed} reports analyzed, but no entities appear in multiple reports yet.`
                  : 'Analysis in progress...'
                }
              </p>
              <div className="mt-3 text-xs text-gray-600">
                <p>Entities need to appear in 2+ reports to be shown here.</p>
                <p>Current threshold: risk_score ≥ 4</p>
              </div>
            </div>
          )}

          {/* Most Dangerous Entity Alert */}
          {sourceData.summary?.most_dangerous_entity && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-300 font-medium">
                  Highest Risk Entity: {sourceData.summary.most_dangerous_entity}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-700/50 text-xs text-gray-500">
            <div className="flex justify-between items-center">
              <span>Last analyzed: {new Date(sourceData.analysis_timestamp).toLocaleString('en-US')}</span>
              <span>{sourceData.total_reports_analyzed || 0} reports analyzed</span>
            </div>
            <div className="mt-1 text-gray-600">
              Risk threshold: ≥{sourceData.query_parameters?.risk_threshold || 4} | 
              Entity type: {sourceData.query_parameters?.entity_type || 'all'} | 
              Limit: {sourceData.query_parameters?.limit || 50}
            </div>
          </div>
        </>
      )}

      {/* Empty State - Only show if no data at all */}
      {!sourceData && !loading && !error && (
        <div className="text-center py-8">
          <Globe className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No entity data available</p>
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

// Hook for using source pooling functionality
export const useSourcePooling = () => {
  const [sourceProfile, setSourceProfile] = useState<SourceProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSourceProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const sourceData = await fetchSourceProfile();
      setSourceProfile(sourceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load source profile');
      console.error('Error loading source profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    sourceProfile,
    loading,
    error,
    loadSourceProfile
  };
};

export default SourcePoolingCard;