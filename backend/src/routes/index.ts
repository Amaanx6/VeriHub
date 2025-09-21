// routes/reports.ts
import { Router, Request, Response } from 'express';
import { PrismaClient, ReportCategory, ReportSeverity, ReportStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Type definitions
interface CreateReportRequest {
  url: string;
  title: string;
  flaggedContent?: string;
  reason?: string;
  correction?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'MISINFORMATION' | 'FAKE_NEWS' | 'MISLEADING' | 'FACTUAL_ERROR' | 'OTHER';
  description: string;
  additionalContext?: string;
  userEmail?: string;
  timestamp?: string;
  userAgent?: string;
  referrer?: string;
}

interface BulkCreateReportRequest {
  reports: CreateReportRequest[];
}

interface GetReportsQuery {
  page?: string;
  limit?: string;
  status?: string;
  category?: string;
  severity?: string;
}


router.post('/bulk', async (req: Request<{}, {}, BulkCreateReportRequest>, res: Response) => {
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
    const validateReport = (report: CreateReportRequest, index: number) => {
      const validCategories = ['MISINFORMATION', 'FAKE_NEWS', 'MISLEADING', 'FACTUAL_ERROR', 'OTHER'];
      const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const errors: string[] = [];

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
    const allErrors: string[] = [];
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
    const escalateSeverity = (current: string, newSev: string): ReportSeverity => {
      if (current === 'CRITICAL' || newSev === 'CRITICAL') return 'CRITICAL';
      if (current === 'HIGH' || newSev === 'HIGH') return 'HIGH';
      if (current === 'MEDIUM' || newSev === 'MEDIUM') return 'MEDIUM';
      return 'LOW';
    };

    // Process reports one by one to handle duplicates
    const results = {
      created: 0,
      updated: 0,
      total: reports.length,
      details: [] as Array<{ url: string, action: 'created' | 'updated', reportCount: number }>
    };

    // Use a transaction to ensure consistency
    await prisma.$transaction(async (prisma) => {
      for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
        const cleanUrl = report.url.trim();

        // Check if URL already exists
        const existingReport = await prisma.report.findUnique({
          where: { url: cleanUrl }
        });

        if (existingReport) {
          // Update existing report
          const updatedReport = await prisma.report.update({
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

        } else {
          // Create new report
          const newReport = await prisma.report.create({
            data: {
              url: cleanUrl,
              title: report.title.trim(),
              flaggedContent: report.flaggedContent?.trim() || null,
              reason: report.reason?.trim() || null,
              correction: report.correction?.trim() || null,
              severity: (report.severity || 'MEDIUM') as ReportSeverity,
              category: report.category as ReportCategory,
              description: report.description.trim(),
              additionalContext: report.additionalContext?.trim() || null,
              userEmail: report.userEmail?.toLowerCase().trim() || null,
              timestamp: report.timestamp ? new Date(report.timestamp) : new Date(),
              userAgent: report.userAgent || req.get('User-Agent') || null,
              referrer: report.referrer || req.get('Referrer') || null,
              status: ReportStatus.PENDING,
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
    });

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

  } catch (error) {
    console.error('Error processing bulk reports:', error);
    return res.status(500).json({
      error: 'Failed to process bulk reports',
      message: 'Internal server error'
    });
  }
});


router.post('/create', async (req: Request<{}, {}, CreateReportRequest>, res: Response) => {
  try {
    const {
      url,
      title,
      flaggedContent,
      reason,
      correction,
      severity = 'MEDIUM',
      category,
      description,
      additionalContext,
      userEmail,
      timestamp,
      userAgent,
      referrer
    } = req.body;

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
    const existingReport = await prisma.report.findUnique({
      where: { url: cleanUrl }
    });

    if (existingReport) {
      // Update existing report count and metadata
      const updatedReport = await prisma.report.update({
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
    const report = await prisma.report.create({
      data: {
        url: cleanUrl,
        title: title.trim(),
        flaggedContent: flaggedContent?.trim() || null,
        reason: reason?.trim() || null,
        correction: correction?.trim() || null,
        severity: severity as ReportSeverity,
        category: category as ReportCategory,
        description: description.trim(),
        additionalContext: additionalContext?.trim() || null,
        userEmail: userEmail?.toLowerCase().trim() || null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        userAgent: userAgent || req.get('User-Agent') || null,
        referrer: referrer || req.get('Referrer') || null,
        status: ReportStatus.PENDING,
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

  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({
      error: 'Failed to create report',
      message: 'Internal server error'
    });
  }
});

router.get('/list', async (req: Request<{}, {}, {}, GetReportsQuery>, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      status,
      category,
      severity
    } = req.query;

    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    
    const where: any = {};

    if (status && ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED'].includes(status)) {
      where.status = status as ReportStatus;
    }

    if (category && ['MISINFORMATION', 'FAKE_NEWS', 'MISLEADING', 'FACTUAL_ERROR', 'OTHER'].includes(category)) {
      where.category = category as ReportCategory;
    }

    if (severity && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity)) {
      where.severity = severity as ReportSeverity;
    }

    
    const [reports, totalCount] = await Promise.all([
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

  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({
      error: 'Failed to fetch reports',
      message: 'Internal server error'
    });
  }
});


router.get('/details/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !id.trim()) {
      return res.status(400).json({
        error: 'Report ID is required'
      });
    }

    const report = await prisma.report.findUnique({
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
        reportCount: true  // Include report count
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

  } catch (error) {
    console.error('Error fetching report:', error);

    return res.status(500).json({
      error: 'Failed to fetch report',
      message: 'Internal server error'
    });
  }
});


export default router;