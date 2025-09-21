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
exports.default = router;
