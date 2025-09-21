"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/reports.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post('/bulk', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reports } = req.body;
        if (!reports || !Array.isArray(reports) || reports.length === 0) {
            return res.status(400).json({
                error: 'Invalid request: reports array is required and cannot be empty'
            });
        }
        if (reports.length > 50) {
            return res.status(400).json({
                error: 'Too many reports: maximum 50 reports per batch'
            });
        }
        // Validation helper function
        const validateReport = (report, index) => {
            const validCategories = ['MISINFORMATION', 'FAKE_NEWS', 'MISLEADING', 'FACTUAL_ERROR', 'OTHER'];
            const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
            const errors = [];
            if (!report.url || !report.title || !report.category || !report.description) {
                errors.push(`Report ${index}: Missing required fields (url, title, category, description)`);
            }
            if (report.description && !report.description.trim()) {
                errors.push(`Report ${index}: Description cannot be empty`);
            }
            if (report.category && !validCategories.includes(report.category)) {
                errors.push(`Report ${index}: Invalid category`);
            }
            if (report.severity && !validSeverities.includes(report.severity)) {
                errors.push(`Report ${index}: Invalid severity`);
            }
            if (report.userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(report.userEmail)) {
                errors.push(`Report ${index}: Invalid email format`);
            }
            return errors;
        };
        // Validate all reports
        const allErrors = [];
        reports.forEach((report, index) => {
            const errors = validateReport(report, index + 1);
            allErrors.push(...errors);
        });
        if (allErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation errors',
                details: allErrors
            });
        }
        // Helper function to escalate severity
        const escalateSeverity = (current, newSev) => {
            if (current === 'CRITICAL' || newSev === 'CRITICAL')
                return 'CRITICAL';
            if (current === 'HIGH' || newSev === 'HIGH')
                return 'HIGH';
            if (current === 'MEDIUM' || newSev === 'MEDIUM')
                return 'MEDIUM';
            return 'LOW';
        };
        // Process reports one by one to handle duplicates
        const results = {
            created: 0,
            updated: 0,
            total: reports.length,
            details: []
        };
        // Use a transaction to ensure consistency
        yield prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            for (let i = 0; i < reports.length; i++) {
                const report = reports[i];
                const cleanUrl = report.url.trim();
                // Check if URL already exists
                const existingReport = yield prisma.report.findUnique({
                    where: { url: cleanUrl }
                });
                if (existingReport) {
                    // Update existing report
                    const updatedReport = yield prisma.report.update({
                        where: { url: cleanUrl },
                        data: {
                            reportCount: existingReport.reportCount + 1,
                            updatedAt: new Date(),
                            severity: escalateSeverity(existingReport.severity, report.severity || 'MEDIUM')
                        }
                    });
                    results.updated++;
                    results.details.push({
                        url: cleanUrl,
                        action: 'updated',
                        reportCount: updatedReport.reportCount
                    });
                }
                else {
                    // Create new report
                    const newReport = yield prisma.report.create({
                        data: {
                            url: cleanUrl,
                            title: report.title.trim(),
                            flaggedContent: ((_a = report.flaggedContent) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                            reason: ((_b = report.reason) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                            correction: ((_c = report.correction) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                            severity: (report.severity || 'MEDIUM'),
                            category: report.category,
                            description: report.description.trim(),
                            additionalContext: ((_d = report.additionalContext) === null || _d === void 0 ? void 0 : _d.trim()) || null,
                            userEmail: ((_e = report.userEmail) === null || _e === void 0 ? void 0 : _e.toLowerCase().trim()) || null,
                            timestamp: report.timestamp ? new Date(report.timestamp) : new Date(),
                            userAgent: report.userAgent || req.get('User-Agent') || null,
                            referrer: report.referrer || req.get('Referrer') || null,
                            status: client_1.ReportStatus.PENDING,
                            reportCount: 1
                        }
                    });
                    results.created++;
                    results.details.push({
                        url: cleanUrl,
                        action: 'created',
                        reportCount: 1
                    });
                }
            }
        }));
        return res.status(201).json({
            success: true,
            message: `Bulk operation completed: ${results.created} created, ${results.updated} updated`,
            summary: {
                totalProcessed: results.total,
                created: results.created,
                updated: results.updated
            },
            details: results.details
        });
    }
    catch (error) {
        console.error('Error processing bulk reports:', error);
        return res.status(500).json({
            error: 'Failed to process bulk reports',
            message: 'Internal server error'
        });
    }
}));
router.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { url, title, flaggedContent, reason, correction, severity = 'MEDIUM', category, description, additionalContext, userEmail, timestamp, userAgent, referrer } = req.body;
        // Validation - userEmail is optional
        if (!url || !title || !category || !description) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['url', 'title', 'category', 'description']
            });
        }
        if (!description.trim()) {
            return res.status(400).json({
                error: 'Description cannot be empty'
            });
        }
        // Validate enums
        const validCategories = ['MISINFORMATION', 'FAKE_NEWS', 'MISLEADING', 'FACTUAL_ERROR', 'OTHER'];
        const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                error: 'Invalid category',
                validCategories
            });
        }
        if (!validSeverities.includes(severity)) {
            return res.status(400).json({
                error: 'Invalid severity',
                validSeverities
            });
        }
        // Validate email format if provided
        if (userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }
        const cleanUrl = url.trim();
        // Check if URL already exists
        const existingReport = yield prisma.report.findUnique({
            where: { url: cleanUrl }
        });
        if (existingReport) {
            // Update existing report count and metadata
            const updatedReport = yield prisma.report.update({
                where: { url: cleanUrl },
                data: {
                    reportCount: existingReport.reportCount + 1,
                    updatedAt: new Date(),
                    // Escalate severity if new report is more severe
                    severity: severity === 'CRITICAL' || existingReport.severity === 'CRITICAL' ? 'CRITICAL' :
                        severity === 'HIGH' || existingReport.severity === 'HIGH' ? 'HIGH' :
                            severity === 'MEDIUM' || existingReport.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW'
                }
            });
            return res.status(200).json({
                success: true,
                message: 'Report updated - URL already flagged',
                reportId: updatedReport.id,
                isUpdate: true,
                data: {
                    id: updatedReport.id,
                    category: updatedReport.category,
                    severity: updatedReport.severity,
                    status: updatedReport.status,
                    reportCount: updatedReport.reportCount,
                    createdAt: updatedReport.createdAt,
                    updatedAt: updatedReport.updatedAt
                }
            });
        }
        // Create new report if URL doesn't exist
        const report = yield prisma.report.create({
            data: {
                url: cleanUrl,
                title: title.trim(),
                flaggedContent: (flaggedContent === null || flaggedContent === void 0 ? void 0 : flaggedContent.trim()) || null,
                reason: (reason === null || reason === void 0 ? void 0 : reason.trim()) || null,
                correction: (correction === null || correction === void 0 ? void 0 : correction.trim()) || null,
                severity: severity,
                category: category,
                description: description.trim(),
                additionalContext: (additionalContext === null || additionalContext === void 0 ? void 0 : additionalContext.trim()) || null,
                userEmail: (userEmail === null || userEmail === void 0 ? void 0 : userEmail.toLowerCase().trim()) || null,
                timestamp: timestamp ? new Date(timestamp) : new Date(),
                userAgent: userAgent || req.get('User-Agent') || null,
                referrer: referrer || req.get('Referrer') || null,
                status: client_1.ReportStatus.PENDING,
                reportCount: 1
            }
        });
        return res.status(201).json({
            success: true,
            message: 'Report created successfully',
            reportId: report.id,
            isUpdate: false,
            data: {
                id: report.id,
                category: report.category,
                severity: report.severity,
                status: report.status,
                reportCount: report.reportCount,
                createdAt: report.createdAt
            }
        });
    }
    catch (error) {
        console.error('Error creating report:', error);
        return res.status(500).json({
            error: 'Failed to create report',
            message: 'Internal server error'
        });
    }
}));
router.get('/list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = '1', limit = '20', status, category, severity } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status && ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED'].includes(status)) {
            where.status = status;
        }
        if (category && ['MISINFORMATION', 'FAKE_NEWS', 'MISLEADING', 'FACTUAL_ERROR', 'OTHER'].includes(category)) {
            where.category = category;
        }
        if (severity && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity)) {
            where.severity = severity;
        }
        const [reports, totalCount] = yield Promise.all([
            prisma.report.findMany({
                where,
                orderBy: [
                    { reportCount: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limitNum,
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    url: true,
                    title: true,
                    flaggedContent: true,
                    category: true,
                    reason: true,
                    description: true,
                    severity: true,
                    status: true,
                    userEmail: true,
                    reviewedAt: true,
                    reviewedBy: true,
                    reportCount: true,
                    timestamp: true
                }
            }),
            prisma.report.count({ where })
        ]);
        const totalPages = Math.ceil(totalCount / limitNum);
        return res.status(200).json({
            success: true,
            data: reports,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            filters: {
                status,
                category,
                severity
            },
            meta: {
                orderBy: 'reportCount desc, createdAt desc',
                note: 'Results ordered by most reported content first'
            }
        });
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        return res.status(500).json({
            error: 'Failed to fetch reports',
            message: 'Internal server error'
        });
    }
}));
router.get('/details/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id || !id.trim()) {
            return res.status(400).json({
                error: 'Report ID is required'
            });
        }
        const report = yield prisma.report.findUnique({
            where: { id: id.trim() },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                url: true,
                title: true,
                flaggedContent: true,
                reason: true,
                correction: true,
                severity: true,
                category: true,
                description: true,
                additionalContext: true,
                userEmail: true,
                timestamp: true,
                userAgent: true,
                referrer: true,
                status: true,
                reviewedAt: true,
                reviewedBy: true,
                reviewNotes: true,
                reportCount: true // Include report count
            }
        });
        if (!report) {
            return res.status(404).json({
                error: 'Report not found',
                message: 'No report exists with the provided ID'
            });
        }
        return res.status(200).json({
            success: true,
            data: report,
            meta: {
                timesReported: report.reportCount,
                lastUpdated: report.updatedAt,
                daysSinceCreated: Math.floor((new Date().getTime() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            }
        });
    }
    catch (error) {
        console.error('Error fetching report:', error);
        return res.status(500).json({
            error: 'Failed to fetch report',
            message: 'Internal server error'
        });
    }
}));
// Helper functions
function extractEntities(text) {
    const PATTERNS = {
        phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,6}/g,
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        domain: /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?/g,
        bank_account: /(?:account|acc|a\/c)[\s:]*(\d{8,18})/gi,
        upi: /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+/g,
        social_handle: /@[a-zA-Z0-9._-]+/g
    };
    const entities = [];
    Object.entries(PATTERNS).forEach(([type, pattern]) => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const cleanValue = cleanEntity(match, type);
                if (cleanValue) {
                    entities.push({ type, value: cleanValue, raw_match: match });
                }
            });
        }
    });
    return entities;
}
function cleanEntity(value, type) {
    var _a;
    switch (type) {
        case 'phone':
            const digits = value.replace(/\D/g, '');
            return digits.length >= 10 ? (digits.length === 10 ? `+91${digits}` : `+${digits}`) : null;
        case 'email':
            return value.toLowerCase().trim();
        case 'domain':
            return value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
        case 'bank_account':
            return ((_a = value.match(/\d{8,18}/)) === null || _a === void 0 ? void 0 : _a[0]) || null;
        default:
            return value.trim();
    }
}
function getRecencyScore(reports) {
    const now = new Date().getTime();
    const avgAge = reports.reduce((sum, report) => {
        const ageInDays = (now - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return sum + ageInDays;
    }, 0) / reports.length;
    return Math.max(0, 1 - (avgAge / 30));
}
function getEntityTypeMultiplier(entityType) {
    const multipliers = {
        phone: 1.2,
        bank_account: 1.3,
        upi: 1.1,
        email: 1.0,
        domain: 1.1,
        social_handle: 0.9
    };
    return multipliers[entityType] || 1.0;
}
function calculateRiskScore(reports, entityType) {
    const frequency = Math.min(reports.length / 10, 1);
    const avgReportCount = reports.reduce((sum, r) => sum + r.reportCount, 0) / reports.length;
    const frequencyBoost = Math.min(avgReportCount / 5, 1);
    const severityWeights = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    const avgSeverity = reports.reduce((sum, r) => sum + (severityWeights[r.severity] || 1), 0) / reports.length;
    const severityScore = avgSeverity / 4;
    const recencyScore = getRecencyScore(reports);
    const entityTypeMultiplier = getEntityTypeMultiplier(entityType);
    const baseScore = (frequency * 0.3 + frequencyBoost * 0.2 + severityScore * 0.3 + recencyScore * 0.2);
    return Math.round(Math.min(baseScore * entityTypeMultiplier * 10, 10));
}
function getSeverityBreakdown(reports) {
    return reports.reduce((acc, report) => {
        acc[report.severity] = (acc[report.severity] || 0) + 1;
        return acc;
    }, {});
}
function getCategoryBreakdown(reports) {
    return reports.reduce((acc, report) => {
        acc[report.category] = (acc[report.category] || 0) + 1;
        return acc;
    }, {});
}
function generateInsights(reports, entity) {
    const insights = [];
    const totalReports = reports.length;
    const totalCount = reports.reduce((sum, r) => sum + r.reportCount, 0);
    if (totalReports >= 5) {
        insights.push(`High frequency identifier: appears in ${totalReports} separate reports with ${totalCount} total mentions`);
    }
    const severityBreakdown = getSeverityBreakdown(reports);
    if (severityBreakdown['CRITICAL'] && severityBreakdown['CRITICAL'] >= 2) {
        insights.push(`Critical threat: linked to ${severityBreakdown['CRITICAL']} critical severity reports`);
    }
    const categoryBreakdown = getCategoryBreakdown(reports);
    const topCategory = Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)[0];
    if (topCategory && topCategory[1] >= 3) {
        insights.push(`Primary threat type: ${topCategory[1]} reports categorized as ${topCategory[0]}`);
    }
    if (entity.type === 'phone') {
        insights.push('Phone numbers are highly trackable - recommend immediate telecom authority notification');
    }
    else if (entity.type === 'bank_account') {
        insights.push('Bank account detected - eligible for immediate financial fraud reporting');
    }
    return insights;
}
// GET /api/forensics/source-profile - Analyze all reports for source patterns
router.get('/source-profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Properly handle query parameter types
        const getRiskThreshold = () => {
            const param = req.query.risk_threshold;
            if (Array.isArray(param)) {
                return parseInt(param[0]) || 4;
            }
            return parseInt(param) || 4;
        };
        const getEntityType = () => {
            const param = req.query.entity_type;
            if (Array.isArray(param)) {
                return param[0];
            }
            return param;
        };
        const getLimit = () => {
            const param = req.query.limit;
            if (Array.isArray(param)) {
                return parseInt(param[0]) || 50;
            }
            return parseInt(param) || 50;
        };
        const risk_threshold = getRiskThreshold();
        const entity_type = getEntityType();
        const limit = getLimit();
        // Get all reports with proper typing
        const allReports = yield prisma.report.findMany({
            select: {
                id: true,
                description: true,
                flaggedContent: true,
                reason: true,
                correction: true,
                additionalContext: true,
                createdAt: true,
                severity: true,
                category: true,
                reportCount: true
            }
        });
        // Create a map with proper typing
        const entityMap = new Map();
        // Process each report to extract entities
        allReports.forEach((report) => {
            const textFields = [
                report.description,
                report.flaggedContent,
                report.reason,
                report.correction,
                report.additionalContext
            ];
            const combinedText = textFields.filter((field) => field !== null).join(' ');
            if (!combinedText.trim()) {
                return; // Skip reports with no text content
            }
            const entities = extractEntities(combinedText);
            entities.forEach(entity => {
                const key = `${entity.type}:${entity.value}`;
                if (!entityMap.has(key)) {
                    entityMap.set(key, {
                        type: entity.type,
                        value: entity.value,
                        linkedReports: [],
                        reportIds: new Set()
                    });
                }
                const existing = entityMap.get(key);
                if (!existing.reportIds.has(report.id)) {
                    existing.linkedReports.push(report);
                    existing.reportIds.add(report.id);
                }
            });
        });
        // Profile entities with proper typing
        const profiledSources = Array.from(entityMap.values())
            .filter(entity => entity.linkedReports.length > 1) // Only entities appearing in multiple reports
            .map(entity => {
            const riskScore = calculateRiskScore(entity.linkedReports, entity.type);
            const dates = entity.linkedReports.map(r => new Date(r.createdAt).getTime());
            // Create a sample entity for insights generation
            const sampleEntity = {
                type: entity.type,
                value: entity.value,
                raw_match: entity.value
            };
            return {
                type: entity.type,
                value: entity.value,
                linked_reports: entity.linkedReports.length,
                total_report_count: entity.linkedReports.reduce((sum, r) => sum + r.reportCount, 0),
                risk_score: riskScore,
                first_seen: new Date(Math.min(...dates)).toISOString(),
                last_seen: new Date(Math.max(...dates)).toISOString(),
                severity_breakdown: getSeverityBreakdown(entity.linkedReports),
                category_breakdown: getCategoryBreakdown(entity.linkedReports),
                insights: generateInsights(entity.linkedReports, sampleEntity)
            };
        })
            .filter(source => !entity_type || source.type === entity_type)
            .filter(source => source.risk_score >= risk_threshold)
            .sort((a, b) => b.risk_score - a.risk_score)
            .slice(0, limit);
        return res.status(200).json({
            success: true,
            analysis_timestamp: new Date().toISOString(),
            total_reports_analyzed: allReports.length,
            total_entities_found: entityMap.size,
            cross_referenced_entities: profiledSources.length,
            sources: profiledSources,
            summary: {
                high_risk_sources: profiledSources.filter(s => s.risk_score >= 7).length,
                medium_risk_sources: profiledSources.filter(s => s.risk_score >= 4 && s.risk_score < 7).length,
                low_risk_sources: profiledSources.filter(s => s.risk_score < 4).length,
                most_dangerous_entity: profiledSources[0] || null
            },
            query_parameters: {
                risk_threshold,
                entity_type: entity_type || 'all',
                limit
            }
        });
    }
    catch (error) {
        console.error('Error in source profiling:', error);
        return res.status(500).json({
            error: 'Failed to profile sources',
            message: 'Internal server error'
        });
    }
}));
router.get('/source-profile/:reportId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reportId } = req.params;
        const report = yield prisma.report.findUnique({
            where: { id: reportId },
            select: {
                id: true,
                description: true,
                flaggedContent: true,
                reason: true,
                correction: true,
                additionalContext: true,
                createdAt: true,
                severity: true,
                category: true,
                reportCount: true
            }
        });
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        const textFields = [
            report.description,
            report.flaggedContent,
            report.reason,
            report.correction,
            report.additionalContext
        ];
        const combinedText = textFields.filter((field) => field !== null).join(' ');
        const entities = extractEntities(combinedText);
        // Profile each entity by finding other reports
        const profiledSources = yield Promise.all(entities.map((entity) => __awaiter(void 0, void 0, void 0, function* () {
            // Search for this entity in other reports
            const searchConditions = [
                { description: { contains: entity.value, mode: 'insensitive' } },
                { flaggedContent: { contains: entity.value, mode: 'insensitive' } },
                { reason: { contains: entity.value, mode: 'insensitive' } },
                { correction: { contains: entity.value, mode: 'insensitive' } },
                { additionalContext: { contains: entity.value, mode: 'insensitive' } }
            ];
            const linkedReports = yield prisma.report.findMany({
                where: {
                    AND: [
                        { OR: searchConditions },
                        { id: { not: reportId } }
                    ]
                },
                select: {
                    id: true,
                    description: true,
                    flaggedContent: true,
                    reason: true,
                    correction: true,
                    additionalContext: true,
                    createdAt: true,
                    severity: true,
                    category: true,
                    reportCount: true
                }
            });
            if (linkedReports.length === 0) {
                return null;
            }
            const riskScore = calculateRiskScore(linkedReports, entity.type);
            const dates = linkedReports.map(r => new Date(r.createdAt).getTime());
            return {
                type: entity.type,
                value: entity.value,
                linked_reports: linkedReports.length,
                total_report_count: linkedReports.reduce((sum, r) => sum + r.reportCount, 0),
                risk_score: riskScore,
                first_seen: new Date(Math.min(...dates)).toISOString(),
                last_seen: new Date(Math.max(...dates)).toISOString(),
                severity_breakdown: getSeverityBreakdown(linkedReports),
                category_breakdown: getCategoryBreakdown(linkedReports),
                insights: generateInsights(linkedReports, entity)
            };
        })));
        const validSources = profiledSources
            .filter((source) => source !== null)
            .sort((a, b) => b.risk_score - a.risk_score);
        return res.status(200).json({
            success: true,
            report_id: reportId,
            analysis_timestamp: new Date().toISOString(),
            entities_extracted: entities.length,
            sources: validSources,
            summary: {
                cross_referenced_sources: validSources.length,
                highest_risk_score: ((_a = validSources[0]) === null || _a === void 0 ? void 0 : _a.risk_score) || 0,
                unique_entities_found: validSources.length
            }
        });
    }
    catch (error) {
        console.error('Error profiling report:', error);
        return res.status(500).json({
            error: 'Failed to profile report sources',
            message: 'Internal server error'
        });
    }
}));
// GET /api/forensics/pattern-detect - Detect similar misinformation patterns
router.get('/pattern-detect', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { similarity_threshold = '0.6', min_cluster_size = '2', category, severity } = req.query;
        const threshold = parseFloat(Array.isArray(similarity_threshold)
            ? similarity_threshold[0]
            : similarity_threshold);
        const minSize = parseInt(Array.isArray(min_cluster_size)
            ? min_cluster_size[0]
            : min_cluster_size);
        // Build filter conditions
        const where = {};
        if (category && typeof category === 'string') {
            where.category = category;
        }
        if (severity && typeof severity === 'string') {
            where.severity = severity;
        }
        // Get reports with flagged content
        // Get reports with flagged content - CORRECTED VERSION
        const reports = yield prisma.report.findMany({
            where: Object.assign(Object.assign({}, where), { AND: [
                    { flaggedContent: { not: null } },
                    { flaggedContent: { not: '' } }
                ] }),
            select: {
                id: true,
                flaggedContent: true,
                url: true,
                title: true,
                category: true,
                severity: true,
                createdAt: true,
                reportCount: true
            }
        });
        if (reports.length < 2) {
            return res.status(200).json({
                success: true,
                message: 'Not enough reports to detect patterns',
                clusters: [],
                summary: { total_reports: reports.length, clusters_found: 0 }
            });
        }
        // Create clusters based on text similarity
        const clusters = createClusters(reports, threshold);
        // Filter clusters by minimum size
        const validClusters = clusters.filter(cluster => cluster.reports.length >= minSize);
        // Generate pattern analysis for each cluster
        const patternResults = validClusters.map((cluster, index) => {
            const reportIds = cluster.reports.map(r => r.id);
            const uniqueUrls = [...new Set(cluster.reports.map(r => extractDomain(r.url)))];
            const totalMentions = cluster.reports.reduce((sum, r) => sum + r.reportCount, 0);
            const severityBreakdown = getSeverityBreakdown(cluster.reports);
            const categoryBreakdown = getCategoryBreakdown(cluster.reports);
            // Calculate risk level
            const riskLevel = calculateClusterRisk(cluster.reports, uniqueUrls.length);
            // Generate insights
            const insights = generateClusterInsights(cluster.reports, uniqueUrls);
            return {
                cluster_id: `CLUST_${String(index + 1).padStart(3, '0')}`,
                main_claim: generateMainClaim(cluster.reports),
                similarity_score: cluster.avgSimilarity,
                reports_linked: reportIds,
                report_count: cluster.reports.length,
                total_mentions: totalMentions,
                unique_domains: uniqueUrls,
                domain_count: uniqueUrls.length,
                risk_level: riskLevel,
                first_seen: new Date(Math.min(...cluster.reports.map(r => new Date(r.createdAt).getTime()))).toISOString(),
                last_seen: new Date(Math.max(...cluster.reports.map(r => new Date(r.createdAt).getTime()))).toISOString(),
                severity_breakdown: severityBreakdown,
                category_breakdown: categoryBreakdown,
                insights: insights
            };
        });
        // Sort clusters by risk level and report count
        const sortedPatterns = patternResults.sort((a, b) => {
            if (a.risk_level !== b.risk_level) {
                const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
                return (riskOrder[b.risk_level] || 0) - (riskOrder[a.risk_level] || 0);
            }
            return b.report_count - a.report_count;
        });
        return res.status(200).json({
            success: true,
            analysis_timestamp: new Date().toISOString(),
            total_reports_analyzed: reports.length,
            clusters: sortedPatterns,
            summary: {
                total_reports: reports.length,
                clusters_found: sortedPatterns.length,
                high_risk_patterns: sortedPatterns.filter(p => p.risk_level === 'high' || p.risk_level === 'critical').length,
                coordinated_campaigns: sortedPatterns.filter(p => p.domain_count >= 3).length,
                most_widespread: sortedPatterns[0] || null
            },
            methodology: {
                similarity_threshold: threshold,
                min_cluster_size: minSize,
                algorithm: 'Jaccard similarity with token-based clustering'
            }
        });
    }
    catch (error) {
        console.error('Error in pattern detection:', error);
        return res.status(500).json({
            error: 'Failed to detect patterns',
            message: 'Internal server error'
        });
    }
}));
// Helper functions for pattern detection
function tokenize(text) {
    return new Set(text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)));
}
function jaccardSimilarity(set1, set2) {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}
function createClusters(reports, threshold) {
    const clusters = [];
    const used = new Set();
    for (let i = 0; i < reports.length; i++) {
        if (used.has(reports[i].id))
            continue;
        const cluster = [reports[i]];
        const tokens1 = tokenize(reports[i].flaggedContent);
        const similarities = [];
        for (let j = i + 1; j < reports.length; j++) {
            if (used.has(reports[j].id))
                continue;
            const tokens2 = tokenize(reports[j].flaggedContent);
            const similarity = jaccardSimilarity(tokens1, tokens2);
            if (similarity >= threshold) {
                cluster.push(reports[j]);
                similarities.push(similarity);
                used.add(reports[j].id);
            }
        }
        if (cluster.length > 1) {
            used.add(reports[i].id);
            const avgSimilarity = similarities.length > 0
                ? similarities.reduce((a, b) => a + b, 0) / similarities.length
                : 1;
            clusters.push({
                reports: cluster,
                avgSimilarity: Math.round(avgSimilarity * 100) / 100
            });
        }
    }
    return clusters;
}
function extractDomain(url) {
    try {
        if (!url || url === '')
            return 'direct-report';
        if (url.includes('whatsapp') || url.includes('telegram'))
            return 'messaging-app';
        if (url.includes('facebook') || url.includes('instagram'))
            return 'social-media';
        const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        return domain || 'unknown-source';
    }
    catch (_a) {
        return 'unknown-source';
    }
}
function calculateClusterRisk(reports, domainCount) {
    const reportCount = reports.length;
    const totalMentions = reports.reduce((sum, r) => sum + r.reportCount, 0);
    const criticalCount = reports.filter(r => r.severity === 'CRITICAL').length;
    const highCount = reports.filter(r => r.severity === 'HIGH').length;
    // Risk calculation based on multiple factors
    let riskScore = 0;
    // Report frequency
    if (reportCount >= 10)
        riskScore += 3;
    else if (reportCount >= 5)
        riskScore += 2;
    else if (reportCount >= 3)
        riskScore += 1;
    // Total mentions across reports
    if (totalMentions >= 20)
        riskScore += 2;
    else if (totalMentions >= 10)
        riskScore += 1;
    // Severity distribution
    if (criticalCount >= 2)
        riskScore += 3;
    else if (highCount >= 3)
        riskScore += 2;
    else if (criticalCount >= 1)
        riskScore += 1;
    // Domain spread (indicates coordination)
    if (domainCount >= 5)
        riskScore += 3;
    else if (domainCount >= 3)
        riskScore += 2;
    else if (domainCount >= 2)
        riskScore += 1;
    // Convert to risk level
    if (riskScore >= 8)
        return 'critical';
    if (riskScore >= 5)
        return 'high';
    if (riskScore >= 3)
        return 'medium';
    return 'low';
}
function generateMainClaim(reports) {
    // Find the most common words across all flagged content
    const allTokens = [];
    reports.forEach(report => {
        const tokens = Array.from(tokenize(report.flaggedContent));
        allTokens.push(...tokens);
    });
    // Count word frequency
    const wordCount = {};
    allTokens.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    // Get the most frequent meaningful words
    const topWords = Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);
    // Use the shortest flagged content as base, enhanced with key terms
    const shortestReport = reports.sort((a, b) => a.flaggedContent.length - b.flaggedContent.length)[0];
    return shortestReport.flaggedContent.length < 100
        ? shortestReport.flaggedContent
        : `Claims about ${topWords.join(', ')}`;
}
function generateClusterInsights(reports, domains) {
    const insights = [];
    const reportCount = reports.length;
    const totalMentions = reports.reduce((sum, r) => sum + r.reportCount, 0);
    if (domains.length >= 3) {
        insights.push(`Coordinated campaign: Same claim appearing across ${domains.length} different sources`);
    }
    if (reportCount >= 5) {
        insights.push(`High frequency pattern: ${reportCount} separate reports with ${totalMentions} total mentions`);
    }
    // Fix the date arithmetic
    const maxTime = Math.max(...reports.map(r => new Date(r.createdAt).getTime()));
    const minTime = Math.min(...reports.map(r => new Date(r.createdAt).getTime()));
    const timeSpan = maxTime - minTime;
    const days = Math.ceil(timeSpan / (1000 * 60 * 60 * 24));
    if (days <= 7 && reportCount >= 3) {
        insights.push(`Rapid spread: Multiple reports within ${days} days suggests viral misinformation`);
    }
    const categories = [...new Set(reports.map(r => r.category))];
    if (categories.length === 1) {
        insights.push(`Focused campaign: All reports categorized as ${categories[0]}`);
    }
    // Check for messaging app spread
    if (domains.includes('messaging-app')) {
        insights.push('Private messaging spread detected - harder to track and counter');
    }
    return insights;
}
exports.default = router;
