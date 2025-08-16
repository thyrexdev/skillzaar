'use client';

import React, { useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Avatar,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  message,
  Tooltip,
  Progress,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UserOutlined,
  FileImageOutlined,
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useColors } from '@/hooks/useColors';
import { useVerificationStore } from '@/stores/verificationStore';
import type { ColumnsType } from 'antd/es/table';
import type { VerificationQueueItem, VerificationDocument } from '@/types/verification.types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const VerificationQueue: React.FC = () => {
  const { primary, success, error, warning, text, background, border } = useColors();
  
  // Zustand store
  const {
    queueItems,
    stats,
    filters,
    pagination,
    queueLoading,
    statsLoading,
    actionLoading,
    previewModalVisible,
    actionModalVisible,
    selectedDocument,
    selectedDocuments,
    
    // Actions
    setFilters,
    setPagination,
    setPreviewModalVisible,
    setActionModalVisible,
    setSelectedDocuments,
    fetchDocumentPreview,
    performDocumentAction,
    downloadDocument,
    refreshData
  } = useVerificationStore();

  const [form] = Form.useForm();
  const [actionType, setActionType] = React.useState<'approve' | 'reject'>('approve');

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return success.main;
      case 'REJECTED': return error.main;
      case 'PENDING': return warning.main;
      case 'EXPIRED': return '#8c8c8c';
      default: return primary.main;
    }
  };

  const getStatusTag = (status: string) => (
    <Tag color={getStatusColor(status)}>{status}</Tag>
  );

  const getRoleIcon = (role: string) => {
    return role === 'FREELANCER' ? <UserOutlined /> : <TeamOutlined />;
  };

  const getDocTypeLabel = (docType: string) => {
    switch (docType) {
      case 'FRONT': return 'ID Front';
      case 'BACK': return 'ID Back';
      case 'SELFIE': return 'Selfie';
      default: return docType;
    }
  };

  // Actions
  const handlePreviewDocument = async (document: VerificationDocument, user: VerificationQueueItem) => {
    await fetchDocumentPreview(document.id);
    setPreviewModalVisible(true);
  };

  const handleAction = (type: 'approve' | 'reject', documentIds: string[]) => {
    setActionType(type);
    setSelectedDocuments(documentIds);
    setActionModalVisible(true);
    form.resetFields();
  };

  const handleSubmitAction = async (values: any) => {
    const success = await performDocumentAction({
      documentId: selectedDocuments.length === 1 ? selectedDocuments[0] : undefined,
      documentIds: selectedDocuments.length > 1 ? selectedDocuments : undefined,
      action: actionType,
      rejectionReason: values.rejectionReason,
      adminNotes: values.adminNotes
    });

    if (success) {
      message.success(`Document${selectedDocuments.length > 1 ? 's' : ''} ${actionType}d successfully`);
      setActionModalVisible(false);
    } else {
      message.error(`Failed to ${actionType} document${selectedDocuments.length > 1 ? 's' : ''}`);
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    const url = await downloadDocument(documentId);
    if (url) {
      window.open(url, '_blank');
    } else {
      message.error('Failed to download document');
    }
  };

  // Table columns
  const columns: ColumnsType<VerificationQueueItem> = [
    {
      title: 'User',
      key: 'user',
      width: 200,
      render: (record: VerificationQueueItem) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            size="large" 
            icon={getRoleIcon(record.userRole)}
            style={{ backgroundColor: primary.main }}
          />
          <div>
            <div className="font-medium" style={{ color: text.primary }}>
              {record.userName}
            </div>
            <div className="text-sm" style={{ color: text.secondary }}>
              {record.userEmail}
            </div>
            <Tag size="small" color={record.userRole === 'FREELANCER' ? 'blue' : 'green'}>
              {record.userRole}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Documents',
      key: 'documents',
      width: 300,
      render: (record: VerificationQueueItem) => (
        <div className="space-y-2">
          {record.documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-2 rounded border" 
                 style={{ borderColor: border.light, backgroundColor: background.elevated }}>
              <div className="flex items-center space-x-2">
                <FileImageOutlined style={{ color: primary.main }} />
                <span className="text-sm">{getDocTypeLabel(doc.docType)}</span>
                {getStatusTag(doc.status)}
              </div>
              <Space>
                <Tooltip title="Preview">
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<EyeOutlined />}
                    onClick={() => handlePreviewDocument(doc, record)}
                  />
                </Tooltip>
                <Tooltip title="Download">
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadDocument(doc.id)}
                  />
                </Tooltip>
              </Space>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'overallStatus',
      width: 120,
      render: (record: VerificationQueueItem) => getStatusTag(record.overallStatus),
    },
    {
      title: 'Submitted',
      key: 'submittedAt',
      width: 120,
      render: (record: VerificationQueueItem) => (
        <div>
          <div className="text-sm" style={{ color: text.primary }}>
            {dayjs(record.submittedAt).format('MMM D, YYYY')}
          </div>
          <div className="text-xs" style={{ color: text.secondary }}>
            {dayjs(record.submittedAt).fromNow()}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (record: VerificationQueueItem) => {
        const pendingDocs = record.documents.filter(doc => doc.status === 'PENDING');
        const documentIds = pendingDocs.map(doc => doc.id);
        
        return (
          <Space>
            {pendingDocs.length > 0 && (
              <>
                <Tooltip title="Approve All">
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleAction('approve', documentIds)}
                    style={{ backgroundColor: success.main, borderColor: success.main }}
                  />
                </Tooltip>
                <Tooltip title="Reject All">
                  <Button
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleAction('reject', documentIds)}
                  />
                </Tooltip>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: text.primary }}>
            Verification Queue
          </h1>
          <p className="text-sm mt-1" style={{ color: text.secondary }}>
            Review and manage user identity verification requests
          </p>
        </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={refreshData}
          loading={queueLoading.loading || statsLoading.loading}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pending Reviews"
                value={stats.totalPending}
                prefix={<ClockCircleOutlined style={{ color: warning.main }} />}
                valueStyle={{ color: warning.main }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Approved"
                value={stats.totalApproved}
                prefix={<CheckOutlined style={{ color: success.main }} />}
                valueStyle={{ color: success.main }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Rejected"
                value={stats.totalRejected}
                prefix={<CloseOutlined style={{ color: error.main }} />}
                valueStyle={{ color: error.main }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completion Rate"
                value={stats.completionRate}
                suffix="%"
                prefix={<FileTextOutlined style={{ color: primary.main }} />}
                valueStyle={{ color: primary.main }}
              />
              <Progress percent={stats.completionRate} size="small" showInfo={false} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Search
              placeholder="Search by name or email"
              style={{ width: 200 }}
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              onSearch={() => setPagination({ current: 1 })}
            />
          </div>
          <div>
            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ status: value })}
            >
              <Option value="PENDING">Pending</Option>
              <Option value="APPROVED">Approved</Option>
              <Option value="REJECTED">Rejected</Option>
              <Option value="EXPIRED">Expired</Option>
            </Select>
          </div>
          <div>
            <Select
              placeholder="Document type"
              style={{ width: 150 }}
              allowClear
              value={filters.docType}
              onChange={(value) => setFilters({ docType: value })}
            >
              <Option value="FRONT">ID Front</Option>
              <Option value="BACK">ID Back</Option>
              <Option value="SELFIE">Selfie</Option>
            </Select>
          </div>
          <div>
            <Select
              placeholder="User role"
              style={{ width: 150 }}
              allowClear
              value={filters.userRole}
              onChange={(value) => setFilters({ userRole: value })}
            >
              <Option value="FREELANCER">Freelancer</Option>
              <Option value="CLIENT">Client</Option>
            </Select>
          </div>
          <div>
            <RangePicker
              placeholder={['Start date', 'End date']}
              value={filters.dateRange ? [dayjs(filters.dateRange[0]), dayjs(filters.dateRange[1])] : null}
              onChange={(dates) => setFilters({ 
                dateRange: dates ? [dates[0]?.toDate(), dates[1]?.toDate()] as [Date, Date] : null 
              })}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={queueItems}
          rowKey="id"
          loading={queueLoading.loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize });
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Document Preview Modal */}
      <Modal
        title={`Document Preview`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3>Document Information</h3>
                <p>File: {selectedDocument.originalName}</p>
                <p>Size: {(selectedDocument.fileSize / 1024).toFixed(2)} KB</p>
                <p>Uploaded: {dayjs(selectedDocument.uploadedAt).format('MMMM D, YYYY h:mm A')}</p>
                <p>Status: {getStatusTag(selectedDocument.status)}</p>
              </div>
            </div>
            
            {/* Document preview placeholder */}
            <div className="text-center p-8 border-2 border-dashed" style={{ borderColor: border.light }}>
              <FileImageOutlined style={{ fontSize: 48, color: text.secondary }} />
              <p style={{ color: text.secondary }}>Document preview will be implemented with media service integration</p>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadDocument(selectedDocument.id)}
              >
                Download Document
              </Button>
            </div>

            {/* Action buttons */}
            {selectedDocument.status === 'PENDING' && (
              <div className="flex gap-2 justify-center">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleAction('approve', [selectedDocument.id])}
                  style={{ backgroundColor: success.main, borderColor: success.main }}
                >
                  Approve
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleAction('reject', [selectedDocument.id])}
                >
                  Reject
                </Button>
              </div>
            )}

            {/* Admin notes and rejection reason */}
            {(selectedDocument.adminNotes || selectedDocument.rejectionReason) && (
              <div className="mt-4 p-4 rounded" style={{ backgroundColor: background.elevated }}>
                {selectedDocument.rejectionReason && (
                  <div className="mb-2">
                    <strong>Rejection Reason:</strong>
                    <p>{selectedDocument.rejectionReason}</p>
                  </div>
                )}
                {selectedDocument.adminNotes && (
                  <div>
                    <strong>Admin Notes:</strong>
                    <p>{selectedDocument.adminNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Document${selectedDocuments.length > 1 ? 's' : ''}`}
        open={actionModalVisible}
        onOk={form.submit}
        onCancel={() => setActionModalVisible(false)}
        confirmLoading={actionLoading.loading}
        okText={actionType === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={{
          danger: actionType === 'reject',
          style: actionType === 'approve' ? { backgroundColor: success.main, borderColor: success.main } : {}
        }}
      >
        <Form form={form} onFinish={handleSubmitAction} layout="vertical">
          {actionType === 'reject' && (
            <Form.Item
              name="rejectionReason"
              label="Rejection Reason"
              rules={[{ required: true, message: 'Please provide a rejection reason' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="Explain why the document is being rejected..."
              />
            </Form.Item>
          )}
          
          <Form.Item
            name="adminNotes"
            label="Admin Notes (Optional)"
          >
            <TextArea 
              rows={2} 
              placeholder="Additional notes for internal reference..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VerificationQueue;
