import { PrismaClient } from '@vync/shared/src/generated/prisma';
import { 
  VerificationQueueItem, 
  VerificationFilters, 
  VerificationStats,
  DocumentPreview 
} from '../interfaces/admin.interfaces';

const prisma = new PrismaClient();

/**
 * Get verification queue with filters
 */
export async function getVerificationQueue(
  filters: VerificationFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{ items: VerificationQueueItem[], total: number, totalPages: number }> {
  const skip = (page - 1) * limit;
  
  // Build where clause
  const whereClause: any = {};
  
  if (filters.status) {
    whereClause.status = filters.status;
  }
  
  if (filters.docType) {
    whereClause.docType = filters.docType;
  }
  
  if (filters.dateRange) {
    whereClause.uploadedAt = {
      gte: new Date(filters.dateRange.start),
      lte: new Date(filters.dateRange.end)
    };
  }

  // User filters
  const userWhere: any = {};
  if (filters.userRole) {
    userWhere.role = filters.userRole;
  }
  
  if (filters.search) {
    userWhere.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  // Get users with verification documents
  const usersWithDocs = await prisma.user.findMany({
    where: {
      ...userWhere,
      verificationDocuments: {
        some: whereClause
      }
    },
    include: {
      verificationDocuments: {
        where: whereClause,
        orderBy: { uploadedAt: 'desc' }
      }
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.user.count({
    where: {
      ...userWhere,
      verificationDocuments: {
        some: whereClause
      }
    }
  });

  // Transform to VerificationQueueItem format
  const items: VerificationQueueItem[] = usersWithDocs.map(user => {
    const documents = user.verificationDocuments.map(doc => ({
      id: doc.id,
      docType: doc.docType as 'FRONT' | 'BACK' | 'SELFIE',
      fileName: doc.fileName,
      originalName: doc.originalName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt,
      status: doc.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED',
      rejectionReason: doc.rejectionReason,
      adminNotes: doc.adminNotes
    }));

    // Determine overall status
    let overallStatus: 'PENDING' | 'INCOMPLETE' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
    const statuses = documents.map(d => d.status);
    
    if (statuses.every(s => s === 'APPROVED')) {
      overallStatus = 'APPROVED';
    } else if (statuses.some(s => s === 'REJECTED')) {
      overallStatus = 'REJECTED';
    } else if (statuses.some(s => s === 'PENDING')) {
      overallStatus = 'PENDING';
    } else {
      overallStatus = 'INCOMPLETE';
    }

    return {
      id: user.id,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role as 'CLIENT' | 'FREELANCER',
      documents,
      submittedAt: Math.min(...documents.map(d => d.uploadedAt.getTime())) 
        ? new Date(Math.min(...documents.map(d => d.uploadedAt.getTime()))) 
        : new Date(),
      lastUpdated: Math.max(...documents.map(d => d.uploadedAt.getTime())) 
        ? new Date(Math.max(...documents.map(d => d.uploadedAt.getTime()))) 
        : new Date(),
      overallStatus
    };
  });

  return {
    items,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get verification statistics
 */
export async function getVerificationStats(): Promise<VerificationStats> {
  const [
    totalPending,
    totalApproved,
    totalRejected,
    docTypeStats,
    recentActivity
  ] = await Promise.all([
    prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
    prisma.verificationDocument.count({ where: { status: 'APPROVED' } }),
    prisma.verificationDocument.count({ where: { status: 'REJECTED' } }),
    
    // Doc type breakdown
    prisma.verificationDocument.groupBy({
      by: ['docType', 'status'],
      _count: true
    }),

    // Recent activity (last 7 days)
    prisma.verificationDocument.groupBy({
      by: ['status'],
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      _count: true
    })
  ]);

  // Calculate average review time
  const reviewedDocs = await prisma.verificationDocument.findMany({
    where: {
      reviewedAt: { not: null },
      status: { in: ['APPROVED', 'REJECTED'] }
    },
    select: {
      uploadedAt: true,
      reviewedAt: true
    }
  });

  const averageReviewTime = reviewedDocs.length > 0
    ? reviewedDocs.reduce((sum, doc) => {
        return sum + (doc.reviewedAt!.getTime() - doc.uploadedAt.getTime());
      }, 0) / reviewedDocs.length / (1000 * 60 * 60) // Convert to hours
    : 0;

  // Process doc type breakdown
  const docTypeBreakdown = {
    front: { pending: 0, approved: 0, rejected: 0 },
    back: { pending: 0, approved: 0, rejected: 0 },
    selfie: { pending: 0, approved: 0, rejected: 0 }
  };

  docTypeStats.forEach(stat => {
    const docType = stat.docType.toLowerCase() as keyof typeof docTypeBreakdown;
    const status = stat.status.toLowerCase() as keyof typeof docTypeBreakdown.front;
    
    if (docTypeBreakdown[docType] && docTypeBreakdown[docType][status] !== undefined) {
      docTypeBreakdown[docType][status] = stat._count;
    }
  });

  const totalDocs = totalPending + totalApproved + totalRejected;
  const completionRate = totalDocs > 0 ? (totalApproved / totalDocs) * 100 : 0;

  // Generate recent activity data (simplified)
  const recentActivityData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split('T')[0],
      approved: 0,
      rejected: 0,
      submitted: 0
    };
  });

  return {
    totalPending,
    totalApproved,
    totalRejected,
    averageReviewTime,
    completionRate,
    docTypeBreakdown,
    recentActivity: recentActivityData
  };
}

/**
 * Get document preview with download URL
 */
export async function getDocumentPreview(documentId: string): Promise<DocumentPreview | null> {
  const document = await prisma.verificationDocument.findUnique({
    where: { id: documentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!document) {
    return null;
  }

  // Generate download URL (this would typically be a signed URL for R2/S3)
  const downloadUrl = `/api/admin/verification/documents/${documentId}/download`;

  return {
    id: document.id,
    userId: document.userId,
    userName: document.user.name,
    userEmail: document.user.email,
    docType: document.docType as 'FRONT' | 'BACK' | 'SELFIE',
    fileName: document.fileName,
    originalName: document.originalName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    uploadedAt: document.uploadedAt,
    status: document.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED',
    rejectionReason: document.rejectionReason,
    adminNotes: document.adminNotes,
    downloadUrl
  };
}

/**
 * Update verification document status
 */
export async function updateDocumentStatus(
  documentId: string,
  action: 'approve' | 'reject',
  adminId: string,
  rejectionReason?: string,
  adminNotes?: string
): Promise<boolean> {
  const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
  
  const updatedDoc = await prisma.verificationDocument.update({
    where: { id: documentId },
    data: {
      status: newStatus,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      rejectionReason: action === 'reject' ? rejectionReason : null,
      adminNotes: adminNotes
    }
  });

  // Check if user should be verified (all docs approved)
  if (action === 'approve') {
    const userDocs = await prisma.verificationDocument.findMany({
      where: { userId: updatedDoc.userId }
    });

    const allApproved = userDocs.every(doc => doc.status === 'APPROVED');
    
    if (allApproved) {
      await prisma.user.update({
        where: { id: updatedDoc.userId },
        data: { isVerified: true }
      });
    }
  }

  // If rejected, mark user as not verified
  if (action === 'reject') {
    await prisma.user.update({
      where: { id: updatedDoc.userId },
      data: { isVerified: false }
    });
  }

  return true;
}

/**
 * Bulk approve/reject documents
 */
export async function bulkUpdateDocuments(
  documentIds: string[],
  action: 'approve' | 'reject',
  adminId: string,
  rejectionReason?: string,
  adminNotes?: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const docId of documentIds) {
    try {
      await updateDocumentStatus(docId, action, adminId, rejectionReason, adminNotes);
      success++;
    } catch (error) {
      failed++;
      console.error(`Failed to update document ${docId}:`, error);
    }
  }

  return { success, failed };
}

/**
 * Get document file for download (would integrate with media service)
 */
export async function getDocumentFile(documentId: string): Promise<{ fileName: string; fileType: string } | null> {
  const document = await prisma.verificationDocument.findUnique({
    where: { id: documentId },
    select: {
      fileName: true,
      fileType: true,
      originalName: true
    }
  });

  return document;
}
