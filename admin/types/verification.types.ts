export interface VerificationDocument {
  id: string;
  docType: 'FRONT' | 'BACK' | 'SELFIE';
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  adminNotes?: string;
}

export interface VerificationQueueItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: 'CLIENT' | 'FREELANCER';
  documents: VerificationDocument[];
  submittedAt: Date;
  lastUpdated: Date;
  overallStatus: 'PENDING' | 'INCOMPLETE' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
}

export interface VerificationStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  averageReviewTime: number;
  completionRate: number;
  docTypeBreakdown: {
    front: { pending: number; approved: number; rejected: number };
    back: { pending: number; approved: number; rejected: number };
    selfie: { pending: number; approved: number; rejected: number };
  };
  recentActivity: Array<{
    date: string;
    approved: number;
    rejected: number;
    submitted: number;
  }>;
}

export interface VerificationFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  docType?: 'FRONT' | 'BACK' | 'SELFIE';
  userRole?: 'CLIENT' | 'FREELANCER';
  search?: string;
  dateRange?: [Date, Date] | null;
}

export interface DocumentPreview {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  docType: 'FRONT' | 'BACK' | 'SELFIE';
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  adminNotes?: string;
  downloadUrl: string;
}

export interface VerificationAction {
  documentId?: string;
  documentIds?: string[];
  action: 'approve' | 'reject';
  rejectionReason?: string;
  adminNotes?: string;
}

export interface VerificationAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}
