"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  Select,
  message,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/components/AdminLayout";
import { adminApi } from '@/lib/api';
import { format } from "date-fns";

const { Search } = Input;
const { Option } = Select;

interface Posting {
  id: string;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  is_membership: boolean;
  is_public: boolean;
  is_sensitive: boolean;
  is_deleted: boolean;
  user_sub: string;
  total_view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  published_at: string | null;
  medias?: {
    id: string;
    type: string;
    file_name: string;
  }[];
  _count?: {
    comments: number;
    likes: number;
    views: number;
  };
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });


  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await adminApi.postings.list({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm,
        status: statusFilter,
      });

      setPosts(response.data.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.total,
      }));
    } catch (error) {
      console.error("Failed to fetch postings:", error);
      message.error("Failed to load postings from server");

      // Set empty data on error
      setPosts([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Separate effect for pagination changes
  useEffect(() => {
    fetchPosts();
  }, [pagination.current, pagination.pageSize]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleViewPost = (postId: string) => {
    message.info(`View posting details: ${postId} (Feature available in read-only mode)`);
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      DRAFT: { color: "orange", text: "임시저장" },
      PUBLISHED: { color: "green", text: "게시됨" },
      ARCHIVED: { color: "red", text: "보관됨" },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Tag color={config?.color}>{config?.text}</Tag>;
  };

  const columns = [
    {
      title: "제목",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Posting) => (
        <div className="space-y-1">
          <div className="font-medium truncate max-w-xs">{text}</div>
          <div className="text-xs text-gray-500 font-mono">ID: {record.id}</div>
          <div className="text-xs text-gray-500">작성자: {record.user_sub}</div>
          {record.medias && record.medias.length > 0 && (
            <div className="text-xs text-blue-500">
              미디어 {record.medias.length}개 첨부
            </div>
          )}
        </div>
      ),
    },
    {
      title: "상태",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "공개 설정",
      key: "visibility",
      render: (_: unknown, record: Posting) => (
        <Space direction="vertical" size={0}>
          {record.is_public ? (
            <Tag color="green">공개</Tag>
          ) : (
            <Tag color="red">비공개</Tag>
          )}
          {record.is_membership && <Tag color="blue">멤버 전용</Tag>}
          {record.is_sensitive && <Tag color="orange">민감 콘텐츠</Tag>}
          {record.is_deleted && <Tag color="red">삭제됨</Tag>}
        </Space>
      ),
    },
    {
      title: "참여도",
      key: "engagement",
      render: (_: unknown, record: Posting) => (
        <Space direction="vertical" size={0}>
          <div className="text-sm">조회 {record._count?.views || record.total_view_count}회</div>
          <div className="text-sm">좋아요 {record._count?.likes || record.like_count}개</div>
          <div className="text-sm">댓글 {record._count?.comments || record.comment_count}개</div>
        </Space>
      ),
    },
    {
      title: "작성일",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string, record: Posting) => (
        <Space direction="vertical" size={0}>
          <div className="text-sm">
            작성일: {format(new Date(text), "MMM dd, yyyy")}
          </div>
          {record.published_at && (
            <div className="text-xs text-gray-500">
              게시일: {format(new Date(record.published_at), "MMM dd, yyyy")}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: "작업",
      key: "actions",
      render: (_: unknown, record: Posting) => (
        <Space>
          <Tooltip title="상세 보기">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewPost(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            포스팅 관리
          </h1>
          <p className="text-gray-600">플랫폼 콘텐츠를 관리하고 조절합니다</p>
        </div>

        <Card>
          <div className="mb-4 flex gap-4">
            <Search
              placeholder="제목 또는 내용으로 포스팅 검색..."
              onSearch={handleSearch}
              style={{ width: 400 }}
              enterButton={<SearchOutlined />}
            />

            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              allowClear
              onChange={handleStatusFilter}
            >
              <Option value="">모든 상태</Option>
              <Option value="DRAFT">임시저장</Option>
              <Option value="PUBLISHED">게시됨</Option>
              <Option value="ARCHIVED">보관됨</Option>
            </Select>
          </div>

          <Table
            columns={columns}
            dataSource={posts}
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
                setPagination((prev) => ({
                  ...prev,
                  current: page,
                  pageSize: size || 20,
                }));
              },
            }}
          />
        </Card>

      </div>
    </AdminLayout>
  );
}
