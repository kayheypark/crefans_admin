'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Card, Button, Space, Tag, Select, message, Badge } from 'antd';
import {
  EyeOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/AdminLayout';
import { adminApi } from '@/lib/api';
import { format } from 'date-fns';

const { Option } = Select;

type ReportTarget = 'USER' | 'POSTING' | 'COMMENT';
type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'COPYRIGHT' | 'FRAUD' | 'OTHER';
type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';

interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTarget;
  target_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_id: string | null;
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });


  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);

      const response = await adminApi.reports.list({
        page: pagination.current,
        limit: pagination.pageSize,
        status: statusFilter,
      });

      setReports(response.data.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.total,
      }));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      message.error('Failed to load reports from server');

      // Set empty data on error
      setReports([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Separate effect for pagination changes
  useEffect(() => {
    fetchReports();
  }, [pagination.current, pagination.pageSize]);

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewReport = (report: Report) => {
    message.info(`View report details: ${report.id} (Feature available in read-only mode)`);
  };

  const getStatusTag = (status: ReportStatus) => {
    const statusConfig = {
      PENDING: { color: 'orange', text: '심사대기' },
      REVIEWED: { color: 'blue', text: '검토완료' },
      RESOLVED: { color: 'green', text: '해결완료' },
      REJECTED: { color: 'red', text: '반려' },
    };
    const config = statusConfig[status];
    return <Tag color={config?.color}>{config?.text}</Tag>;
  };

  const getReasonTag = (reason: ReportReason) => {
    const reasonConfig = {
      SPAM: { color: 'orange', text: '스팸' },
      HARASSMENT: { color: 'red', text: '괴롭하기' },
      INAPPROPRIATE: { color: 'volcano', text: '부적절한 콘텐츠' },
      COPYRIGHT: { color: 'purple', text: '저작권 위반' },
      FRAUD: { color: 'magenta', text: '사기' },
      OTHER: { color: 'default', text: '기타' },
    };
    const config = reasonConfig[reason];
    return <Tag color={config?.color}>{config?.text}</Tag>;
  };

  const getTargetTag = (type: ReportTarget) => {
    const targetConfig = {
      USER: { color: 'blue', text: '사용자' },
      POSTING: { color: 'green', text: '포스팅' },
      COMMENT: { color: 'cyan', text: '댓글' },
    };
    const config = targetConfig[type];
    return <Tag color={config?.color}>{config?.text}</Tag>;
  };

  const columns = [
    {
      title: '신고 ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => (
        <span className="font-mono text-sm">{text}</span>
      ),
    },
    {
      title: '신고 대상',
      key: 'target',
      render: (_: unknown, record: Report) => (
        <Space direction="vertical" size={0}>
          {getTargetTag(record.target_type)}
          <span className="text-xs text-gray-500 font-mono">{record.target_id}</span>
        </Space>
      ),
    },
    {
      title: '신고 사유',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: ReportReason) => getReasonTag(reason),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: ReportStatus) => getStatusTag(status),
    },
    {
      title: '신고자',
      dataIndex: 'reporter_id',
      key: 'reporter_id',
      render: (text: string) => (
        <span className="font-mono text-sm">{text}</span>
      ),
    },
    {
      title: '상세 내용',
      dataIndex: 'description',
      key: 'description',
      render: (text: string | null) => (
        <div className="max-w-xs">
          {text ? (
            <div className="truncate" title={text}>
              {text}
            </div>
          ) : (
            <span className="text-gray-400 italic">설명 없음</span>
          )}
        </div>
      ),
    },
    {
      title: '신고일',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => format(new Date(text), 'MMM dd, yyyy HH:mm'),
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, record: Report) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewReport(record)}
          >
            보기
          </Button>
        </Space>
      ),
    },
  ];

  const pendingCount = reports.filter(r => r.status === 'PENDING').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            신고 관리
            {pendingCount > 0 && (
              <Badge count={pendingCount} className="ml-2" />
            )}
          </h1>
          <p className="text-gray-600">사용자 신고를 검토하고 관리합니다</p>
        </div>

        <Card>
          <div className="mb-4">
            <Select
              placeholder="상태별 필터"
              style={{ width: 150 }}
              allowClear
              onChange={handleStatusFilter}
            >
              <Option value="">모든 상태</Option>
              <Option value="PENDING">심사대기</Option>
              <Option value="REVIEWED">검토완료</Option>
              <Option value="RESOLVED">해결완료</Option>
              <Option value="REJECTED">반려</Option>
            </Select>
          </div>

          <Table
            columns={columns}
            dataSource={reports}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `전체 ${total}개 중 ${range[0]}-${range[1]}개`,
              onChange: (page, size) => {
                setPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: size || 20,
                }));
              },
            }}
            rowClassName={(record) =>
              record.status === 'PENDING' ? 'bg-orange-50' : ''
            }
          />
        </Card>

      </div>
    </AdminLayout>
  );
}