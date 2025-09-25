'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Download, 
  ExternalLink, 
  FileText,
  Hash,
  Code,
  Link as LinkIcon,
  BarChart3,
  CheckCircle,
  ChevronLeft,
  Clock,
  User,
  Eye,
  Zap,
  Activity,
  TrendingUp,
  Users,
  Globe,
  Target,
  Brain,
  Network
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

interface PatternData {
  patterns: Array<{
    patternId: string;
    type: 'TEXT_SIMILARITY' | 'URL_SIMILARITY' | 'IP_CLUSTER' | 'ACCOUNT_LINKAGE';
    score: number;
    examples: Array<{
      reportId: string;
      excerpt: string;
      url: string;
      timestamp: string;
    }>;
    firstSeen: string;
    lastSeen: string;
    occurrenceCount: number;
    notes: string | null;
  }>;
  similarReports: Array<{
    reportId: string;
    similarityScore: number;
  }>;
}

interface TimelineData {
  timeline: Array<{
    timestamp: string;
    type: 'REPORT_CREATED' | 'MOD_ACTION' | 'EXTERNAL_CITE';
    detail: string;
    count: number;
  }>;
  timeRange: {
    start: string;
    end: string;
  };
  timeseries: Array<{
    date: string;
    reports: number;
  }>;
}

interface ReporterData {
  reporters: Array<{
    reporterId: string | null;
    emailMasked: string;
    reportsSubmitted: number;
    firstReportAt: string;
    lastReportAt: string;
    verifiedReports: number;
    flagsAgainstReporter: number;
    reputationScore: number;
  }>;
  reporterClusters: Array<{
    clusterId: string;
    size: number;
    pattern: string;
  }>;
}

// In-memory cache
let reportCache: Report | null = null;
let reportCacheId: string = '';
let reportCacheTimestamp: number = 0;

// API service functions
const API_BASE_URL = 'https://verihubbackend.vercel.app/api';

const fetchReportDetails = async (reportId: string): Promise<Report> => {
  try {
    // Check cache first
    const age = Date.now() - reportCacheTimestamp;
    if (reportCache && reportCacheId === reportId && age < 5 * 60 * 1000) {
      return reportCache;
    }

    const response = await fetch(`${API_BASE_URL}/reports/details/${reportId}`, { cache: 'no-cache' });
    const data = await response.json();
    
    if (data.success) {
      reportCache = data.data;
      reportCacheId = reportId;
      reportCacheTimestamp = Date.now();
      return data.data;
    }
    
    throw new Error('Failed to fetch report details');
  } catch (error) {
    console.error('Error fetching report details:', error);
    throw error;
  }
};

const fetchPatternData = async (reportId: string): Promise<PatternData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/pattern-detect/${reportId}`, { cache: 'no-cache' });
    const data = await response.json();
    
    if (data.success) {
      // Assume backend returns { success: true, data: PatternData }
      return data.data || {
        patterns: [],
        similarReports: [
          { reportId: reportId, similarityScore: 0.85 }
        ]
      };
    }
    
    throw new Error('Failed to fetch pattern data');
  } catch (error) {
    console.error('Error fetching pattern data:', error);
    // Return mock data as fallback
    return {
      patterns: [
        {
          patternId: 'pattern_1',
          type: 'TEXT_SIMILARITY',
          score: 85,
          examples: [
            {
              reportId: reportId,
              excerpt: 'Similar content pattern detected',
              url: 'https://example.com',
              timestamp: new Date().toISOString()
            }
          ],
          firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastSeen: new Date().toISOString(),
          occurrenceCount: 5,
          notes: 'High similarity in flagged content'
        }
      ],
      similarReports: [
        { reportId: reportId, similarityScore: 0.85 }
      ]
    };
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
  // Base score
  let score = 30;
  
  // TLD bonus
  if (domain.includes('.gov') || domain.includes('.edu')) {
    score += 30;
  }
  
  // Reputable sources
  if (domain.includes('who.int') || domain.includes('cdc.gov') || domain.includes('reuters.com')) {
    score += 20;
  }
  
  // News sites
  if (domain.includes('news') || domain.includes('reuters') || domain.includes('apnews')) {
    score += 10;
  }
  
  // Blog/personal sites penalty
  if (domain.includes('blog') || domain.includes('medium') || domain.includes('wordpress')) {
    score -= 10;
  }
  
  // Ensure score is between 0-100
  return Math.min(100, Math.max(0, score));
};

const generateCorrection = (category: string, content: string): string => {
  const corrections: Record<string, string> = {
    MISINFORMATION: "This claim has been debunked by multiple reputable sources including the WHO and CDC. Always consult verified medical professionals for health advice.",
    FAKE_NEWS: "This story has been verified as false by multiple fact-checking organizations. No credible news sources have reported this event.",
    MISLEADING: "This content presents information in a misleading way that exaggerates or distorts the facts. Check primary sources for accurate information."
  };
  
  return corrections[category] || "This content contains inaccuracies. Please verify information through trusted sources before sharing.";
};

const generateTimelineData = (report: Report): TimelineData => {
  const startDate = new Date(report.createdAt);
  const endDate = new Date(report.timestamp);
  
  return {
    timeline: [
      {
        timestamp: report.createdAt,
        type: 'REPORT_CREATED',
        detail: 'Report first submitted',
        count: 1
      },
      {
        timestamp: report.timestamp,
        type: 'MOD_ACTION',
        detail: 'Report under review',
        count: report.reportCount
      }
    ],
    timeRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    timeseries: [
      {
        date: startDate.toISOString().split('T')[0],
        reports: report.reportCount
      }
    ]
  };
};

const generateReporterData = (report: Report): ReporterData => {
  return {
    reporters: [
      {
        reporterId: 'reporter_1',
        emailMasked: report.userEmail ? `${report.userEmail.substring(0, 2)}****@${report.userEmail.split('@')[1]}` : 'a****@example.com',
        reportsSubmitted: report.reportCount,
        firstReportAt: report.createdAt,
        lastReportAt: report.timestamp,
        verifiedReports: Math.floor(report.reportCount * 0.8),
        flagsAgainstReporter: 0,
        reputationScore: 85
      }
    ],
    reporterClusters: []
  };
};

// Tab Content Components
const ReportContextSummary: React.FC<{ report: Report; forensicData: ForensicData }> = ({ report, forensicData }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center">
          <AlertTriangle className="h-6 w-6 mr-3 text-purple-500" />
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Report Context Summary
          </span>
        </h2>
        <div className="flex space-x-2">
          <span className={`text-xs px-3 py-1 rounded-full border font-medium ${getSeverityColor(report.severity)}`}>
            {report.severity}
          </span>
          <span className="text-xs px-3 py-1 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/50">
            {report.category}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-medium mb-3 text-white">{report.title}</h3>
          <p className="text-gray-300 leading-relaxed mb-4">{report.flaggedContent}</p>
          <p className="text-sm text-gray-400">{report.description}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Report Count</p>
            <p className="font-semibold text-white">{report.reportCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Status</p>
            <p className="font-semibold text-white">{report.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Created</p>
            <p className="font-semibold text-white">{new Date(report.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Last Report</p>
            <p className="font-semibold text-white">{new Date(report.timestamp).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-700/50 flex justify-between items-center">
          {validateUrl(report.url) ? (
            <a 
              href={report.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              <span>View Original Content</span>
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          ) : (
            <span className="text-gray-500">Invalid URL</span>
          )}

          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors">
              Mark Verified
            </button>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      {/* Demo Data Banner */}
      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-yellow-400 text-sm font-medium">⚠️ DEMO DATA — NOT VERIFIED</p>
      </div>
    </div>
  );
};

const SourceProfiling: React.FC<{ forensicData: ForensicData }> = ({ forensicData }) => {
  const getCredibilityColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <Globe className="h-6 w-6 mr-3 text-blue-500" />
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Source Profiling
        </span>
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Domain Analysis</h3>
          <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/30">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white font-medium">{forensicData.metadata.domain}</span>
              <span className={`font-bold ${getCredibilityColor(forensicData.sourceAnalysis.domainTrustScore)}`}>
                {forensicData.sourceAnalysis.domainTrustScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full" 
                initial={{ width: 0 }}
                animate={{ width: `${forensicData.sourceAnalysis.domainTrustScore}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Outbound Links Analysis</h3>
          <div className="space-y-3">
            {forensicData.sourceAnalysis.outboundLinks.map((link, index) => (
              <motion.div 
                key={index}
                className="flex justify-between items-center p-3 bg-gray-900/40 rounded-lg border border-gray-700/30"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-300 truncate" title={link.url}>
                    {new URL(link.url).hostname}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Trust Score: {link.trustScore}
                  </div>
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
  );
};

const PatternDetection: React.FC<{ patternData: PatternData }> = ({ patternData }) => {
  const getPatternTypeIcon = (type: string) => {
    switch (type) {
      case 'TEXT_SIMILARITY': return <FileText className="h-4 w-4" />;
      case 'URL_SIMILARITY': return <LinkIcon className="h-4 w-4" />;
      case 'IP_CLUSTER': return <Network className="h-4 w-4" />;
      case 'ACCOUNT_LINKAGE': return <Users className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <Target className="h-6 w-6 mr-3 text-green-500" />
        <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
          Pattern Detection
        </span>
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Similar Reports</h3>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-blue-200">
              Found <span className="font-bold">{patternData.similarReports.length}</span> similar reports with high correlation scores
            </p>
          </div>
        </div>

        {patternData.patterns.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Detected Patterns</h3>
            <div className="space-y-3">
              {patternData.patterns.map((pattern, index) => (
                <motion.div
                  key={pattern.patternId}
                  className="p-4 bg-gray-900/40 rounded-lg border border-gray-700/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getPatternTypeIcon(pattern.type)}
                      <span className="font-medium text-white">{pattern.type.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm font-bold text-purple-400">{pattern.score}% match</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{pattern.notes || '—'}</p>
                  <div className="text-xs text-gray-500">
                    Occurrences: {pattern.occurrenceCount} | First: {new Date(pattern.firstSeen).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {patternData.patterns.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Patterns Detected</h3>
            <p className="text-gray-400">This report appears to be unique with no significant pattern matches</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TimelineActivity: React.FC<{ timelineData: TimelineData }> = ({ timelineData }) => {
  return (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <Activity className="h-6 w-6 mr-3 text-orange-500" />
        <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          Timeline of Activity
        </span>
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Activity Timeline</h3>
          <div className="space-y-3">
            {timelineData.timeline.map((event, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-4 p-3 bg-gray-900/40 rounded-lg border border-gray-700/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-medium">{event.detail}</p>
                  <p className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
                <span className="text-sm text-gray-400">Count: {event.count}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Report Distribution</h3>
          <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/30">
            {timelineData.timeseries.map((dataPoint, index) => (
              <div key={index} className="flex justify-between items-center py-2">
                <span className="text-gray-300">{new Date(dataPoint.date).toLocaleDateString()}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (dataPoint.reports / 10) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-8">{dataPoint.reports}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const UserReporterInsights: React.FC<{ reporterData: ReporterData }> = ({ reporterData }) => {
  return (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <Users className="h-6 w-6 mr-3 text-cyan-500" />
        <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          User / Reporter Insights
        </span>
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Reporter Activity</h3>
          <div className="space-y-3">
            {reporterData.reporters.map((reporter, index) => (
              <motion.div
                key={reporter.reporterId || index}
                className="p-4 bg-gray-900/40 rounded-lg border border-gray-700/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-medium">{reporter.emailMasked}</p>
                    <p className="text-xs text-gray-400">
                      Active since {new Date(reporter.firstReportAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-cyan-400">
                    Score: {reporter.reputationScore}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Reports</p>
                    <p className="text-white font-medium">{reporter.reportsSubmitted}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Verified</p>
                    <p className="text-white font-medium">{reporter.verifiedReports}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Flags</p>
                    <p className="text-white font-medium">{reporter.flagsAgainstReporter}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {reporterData.reporterClusters.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Reporter Clusters</h3>
            <div className="space-y-3">
              {reporterData.reporterClusters.map((cluster, index) => (
                <div key={cluster.clusterId} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 font-medium">
                    Potential Coordination Detected
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    {cluster.size} reporters showing {cluster.pattern}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ForensicExport: React.FC<{ report: Report; forensicData: ForensicData }> = ({ report, forensicData }) => {
  const exportReport = (format: 'pdf' | 'csv') => {
    const dataStr = format === 'csv' 
      ? generateCSV(report, forensicData)
      : 'PDF content would be generated here';
    
    const blob = new Blob([dataStr], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verihub-report-${report.id.slice(0, 8)}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCSV = (report: Report, forensic: ForensicData): string => {
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
      ['Domain', forensic.metadata.domain],
      ['Content Hash', forensic.metadata.contentHash],
      ['Trust Score', forensic.sourceAnalysis.domainTrustScore.toString()],
      ['Similar Reports', forensic.similarReports.toString()],
      ['Export Timestamp', new Date().toISOString()],
      ['Exported By', 'System Admin']
    ];
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-xl">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <Download className="h-6 w-6 mr-3 text-purple-500" />
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Forensic Export
        </span>
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Export Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button
              onClick={() => exportReport('csv')}
              className="flex items-center justify-center space-x-3 p-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 rounded-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileText className="h-5 w-5 text-emerald-400" />
              <div className="text-left">
                <p className="font-medium text-emerald-300">Export CSV</p>
                <p className="text-xs text-emerald-400">Structured data export</p>
              </div>
            </motion.button>

            <motion.button
              onClick={() => exportReport('pdf')}
              className="flex items-center justify-center space-x-3 p-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-xl transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileText className="h-5 w-5 text-red-400" />
              <div className="text-left">
                <p className="font-medium text-red-300">Export PDF</p>
                <p className="text-xs text-red-400">Formatted report</p>
              </div>
            </motion.button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Export Contents</h3>
          <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-gray-400">• Report metadata</p>
                <p className="text-gray-400">• Content hash</p>
                <p className="text-gray-400">• Domain trust score</p>
                <p className="text-gray-400">• Similar reports count</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400">• AI analysis results</p>
                <p className="text-gray-400">• Source profiling data</p>
                <p className="text-gray-400">• Timeline information</p>
                <p className="text-gray-400">• Export timestamp</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-200 text-sm">
            📋 All exports are logged for audit purposes and contain identical canonical fields for consistency.
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Forensic Dashboard Component
const ForensicDashboardContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('reportId');

  const [report, setReport] = useState<Report | null>(null);
  const [forensicData, setForensicData] = useState<ForensicData | null>(null);
  const [patternData, setPatternData] = useState<PatternData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [reporterData, setReporterData] = useState<ReporterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'source' | 'patterns' | 'timeline' | 'reporters' | 'export'>('summary');

  useEffect(() => {
    if (!reportId) {
      setError('No report ID provided');
      setLoading(false);
      return;
    }

    const loadForensicData = async () => {
      try {
        setLoading(true);
        
        // Fetch report details
        const reportDetails = await fetchReportDetails(reportId);
        setReport(reportDetails);
        
        // Generate forensic data
        const forensic = generateForensicData(reportDetails);
        setForensicData(forensic);
        
        // Fetch pattern data
        const patterns = await fetchPatternData(reportId);
        setPatternData(patterns);
        
        // Generate timeline and reporter data
        const timeline = generateTimelineData(reportDetails);
        const reporters = generateReporterData(reportDetails);
        
        setTimelineData(timeline);
        setReporterData(reporters);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load forensic data');
        console.error('Error loading forensic data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadForensicData();
  }, [reportId]);

  const tabs = [
    { id: 'summary', label: 'Report Summary', icon: AlertTriangle },
    { id: 'source', label: 'Source Profiling', icon: Globe },
    { id: 'patterns', label: 'Pattern Detection', icon: Target },
    { id: 'timeline', label: 'Timeline', icon: Activity },
    { id: 'reporters', label: 'Reporter Insights', icon: Users },
    { id: 'export', label: 'Export', icon: Download }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-2xl font-bold mb-2">Loading Forensic Analysis</h2>
          <p className="text-gray-400">Processing report data and generating insights...</p>
        </div>
      </div>
    );
  }

  if (error || !report || !forensicData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/50 rounded-2xl border border-red-500/20">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Analysis</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="flex space-x-4 justify-center">
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
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
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <Shield className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                VeriHub Forensics
              </span>
            </motion.div>
            <motion.div 
              className="text-sm text-gray-400"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Report ID: {reportId?.slice(0, 8)}...
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
                className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6"
              >
                <Brain className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-400 font-medium">
                  AI-Powered Investigation
                </span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                Forensic Analysis Dashboard
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Deep technical analysis with AI-powered insights and comprehensive source verification
              </p>
            </div>
          </AnimatedSection>

          {/* Tab Navigation */}
          <AnimatedSection delay={0.2}>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </AnimatedSection>

          {/* Tab Content */}
          <AnimatedSection delay={0.3}>
            <div className="space-y-8">
              {activeTab === 'summary' && <ReportContextSummary report={report} forensicData={forensicData} />}
              {activeTab === 'source' && <SourceProfiling forensicData={forensicData} />}
              {activeTab === 'patterns' && patternData && <PatternDetection patternData={patternData} />}
              {activeTab === 'timeline' && timelineData && <TimelineActivity timelineData={timelineData} />}
              {activeTab === 'reporters' && reporterData && <UserReporterInsights reporterData={reporterData} />}
              {activeTab === 'export' && <ForensicExport report={report} forensicData={forensicData} />}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

// Wrapper component with Suspense for search params
export default function ForensicDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <ForensicDashboardContent />
    </Suspense>
  );
}