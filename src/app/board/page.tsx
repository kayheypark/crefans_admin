'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Typography,
  Tooltip,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/AdminLayout';
import { apiClient } from '../../../lib/api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 카테고리 매핑
const CATEGORY_CONFIG = {
  NOTICE: {
    name: '공지사항',
    color: 'blue'
  },
  EVENT: {
    name: '이벤트',
    color: 'green'
  }
} as const;

interface BoardPost {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  category: {
    code: string;
    name: string;
  };
  is_important: boolean;
  is_published: boolean;
  views: number;
  author: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
}


export default function BoardPage() {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<BoardPost | null>(null);
  const [viewingPost, setViewingPost] = useState<BoardPost | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    category: '',
    includeDeleted: false,
  });

  const fetchPosts = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeDeleted: filters.includeDeleted.toString(),
      });

      if (filters.category) {
        params.append('category', filters.category);
      }

      const response = await apiClient.get(`/admin/board?${params}`);
      const data = response.data;

      if (data.success) {
        setPosts(data.data.posts);
        setPagination({
          current: page,
          pageSize: limit,
          total: data.data.pagination.total,
        });
      } else {
        message.error(data.message || '게시글 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      message.error('게시글 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(pagination.current, pagination.pageSize);
  }, [filters]);

  const handleTableChange = (paginationInfo: { current?: number; pageSize?: number }) => {
    fetchPosts(paginationInfo.current || 1, paginationInfo.pageSize || 20);
  };

  const handleCreate = () => {
    setEditingPost(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleView = async (post: BoardPost) => {
    try {
      const response = await apiClient.get(`/admin/board/${post.id}`);
      const data = response.data;

      if (data.success) {
        setViewingPost(data.data);
        setViewModalVisible(true);
      } else {
        message.error(data.message || '게시글을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching post detail:', error);
      message.error('게시글을 불러오는데 실패했습니다.');
    }
  };

  const handleEdit = (post: BoardPost) => {
    setEditingPost(post);
    form.setFieldsValue({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category.code,
      is_important: post.is_important,
      author: post.author,
    });
    setModalVisible(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      const isEdit = !!editingPost;
      const url = isEdit ? `/admin/board/${editingPost.id}` : '/admin/board';

      const response = isEdit
        ? await apiClient.put(url, values)
        : await apiClient.post(url, values);

      const data = response.data;

      if (data.success) {
        message.success(
          isEdit ? '게시글이 수정되었습니다.' : '게시글이 생성되었습니다.'
        );
        setModalVisible(false);
        fetchPosts(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || '작업에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('작업에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiClient.delete(`/admin/board/${id}`);
      const data = response.data;

      if (data.success) {
        message.success('게시글이 삭제되었습니다.');
        fetchPosts(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      message.error('삭제에 실패했습니다.');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await apiClient.put(`/admin/board/${id}/restore`);
      const data = response.data;

      if (data.success) {
        message.success('게시글이 복원되었습니다.');
        fetchPosts(pagination.current, pagination.pageSize);
      } else {
        message.error(data.message || '복원에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error restoring post:', error);
      message.error('복원에 실패했습니다.');
    }
  };

  const columns = [
    {
      title: '상태',
      key: 'status',
      width: 120,
      render: (record: BoardPost) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_published ? 'green' : 'orange'}>
            {record.is_published ? '발행됨' : '미발행'}
          </Tag>
          {record.is_deleted && <Tag color="red">삭제됨</Tag>}
        </Space>
      ),
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      width: "unset",
      render: (title: string, record: BoardPost) => (
        <div>
          <div>
            {title}
            {record.is_important && (
              <Tag color="red" style={{ marginLeft: 8 }}>
                중요
              </Tag>
            )}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999',
            fontFamily: 'monospace',
            marginTop: '4px'
          }}>
            {record.id}
          </div>
        </div>
      ),
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: { code: string; name: string }) => {
        const config = CATEGORY_CONFIG[category.code as keyof typeof CATEGORY_CONFIG];
        return (
          <Tag color={config?.color || 'default'}>
            {config?.name || category.name}
          </Tag>
        );
      },
    },
    {
      title: '조회수',
      dataIndex: 'views',
      key: 'views',
      width: 80,
    },
    {
      title: '작성자',
      dataIndex: 'author',
      key: 'author',
      width: 160,
    },
    {
      title: '날짜',
      key: 'dates',
      width: 180,
      render: (record: BoardPost) => {
        const formatDate = (date: string) => {
          return new Date(date).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(/\. /g, '-').replace(/\.$/, '');
        };

        return (
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <div>생성 {formatDate(record.created_at)}</div>
            {record.published_at && (
              <div>발행 {formatDate(record.published_at)}</div>
            )}
          </div>
        );
      },
    },
    {
      title: '작업',
      key: 'action',
      width: 200,
      render: (record: BoardPost) => (
        <Space>
          <Tooltip title="보기">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="수정">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.is_deleted}
            />
          </Tooltip>
          {record.is_deleted ? (
            <Tooltip title="복원">
              <Button
                size="small"
                icon={<UndoOutlined />}
                onClick={() => handleRestore(record.id)}
              />
            </Tooltip>
          ) : (
            <Popconfirm
              title="정말로 삭제하시겠습니까?"
              onConfirm={() => handleDelete(record.id)}
              okText="삭제"
              cancelText="취소"
            >
              <Tooltip title="삭제">
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>게시판 관리</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            새 게시글
          </Button>
        </div>

        <Card style={{ marginBottom: '24px' }}>
          <Space>
            <Select
              placeholder="카테고리 선택"
              style={{ width: 120 }}
              allowClear
              value={filters.category || undefined}
              onChange={(value) => setFilters({ ...filters, category: value || '' })}
            >
              <Option value="NOTICE">공지사항</Option>
              <Option value="EVENT">이벤트</Option>
            </Select>
            <Switch
              checkedChildren="삭제됨 포함"
              unCheckedChildren="활성만"
              checked={filters.includeDeleted}
              onChange={(checked) => setFilters({ ...filters, includeDeleted: checked })}
            />
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={posts}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `총 ${total}개`,
          }}
          onChange={handleTableChange}
        />

        <Modal
          title={editingPost ? '게시글 수정' : '새 게시글'}
          open={modalVisible}
          onOk={handleModalSubmit}
          onCancel={() => setModalVisible(false)}
          width={800}
          okText="저장"
          cancelText="취소"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="title"
              label="제목"
              rules={[{ required: true, message: '제목을 입력해주세요.' }]}
            >
              <Input placeholder="게시글 제목을 입력하세요" />
            </Form.Item>

            <Form.Item
              name="content"
              label="내용"
              rules={[{ required: true, message: '내용을 입력해주세요.' }]}
            >
              <TextArea rows={10} placeholder="게시글 내용을 입력하세요" />
            </Form.Item>

            <Form.Item
              name="category"
              label="카테고리"
              rules={[{ required: true, message: '카테고리를 선택해주세요.' }]}
            >
              <Select placeholder="카테고리를 선택하세요">
                <Option value="NOTICE">공지사항</Option>
                <Option value="EVENT">이벤트</Option>
              </Select>
            </Form.Item>

            <Form.Item name="excerpt" label="메모">
              <TextArea rows={2} placeholder="게시글 메모를입력하세요 (선택사항, 회원들에게 노출이 되지 않습니다)" />
            </Form.Item>

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Form.Item name="is_important" valuePropName="checked">
                <Switch checkedChildren="중요" unCheckedChildren="일반" />
              </Form.Item>

              <Form.Item name="publishNow" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="즉시 발행" unCheckedChildren="미발행" />
              </Form.Item>
            </Space>

            <Form.Item name="author" label="작성자">
              <Input placeholder="작성자" defaultValue="크리팬스 관리자" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 게시글 보기 모달 */}
        <Modal
          title="게시글 보기"
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          width={800}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              닫기
            </Button>
          ]}
        >
          {viewingPost && (
            <div style={{ padding: '20px 0' }}>
              {/* 게시글 헤더 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Tag color={CATEGORY_CONFIG[viewingPost.category.code as keyof typeof CATEGORY_CONFIG]?.color || 'default'}>
                    {CATEGORY_CONFIG[viewingPost.category.code as keyof typeof CATEGORY_CONFIG]?.name || viewingPost.category.name}
                  </Tag>
                  {viewingPost.is_important && <Tag color="red">중요</Tag>}
                  <Tag color={viewingPost.is_published ? 'green' : 'orange'}>
                    {viewingPost.is_published ? '발행됨' : '미발행'}
                  </Tag>
                  {viewingPost.is_deleted && <Tag color="red">삭제됨</Tag>}
                </div>

                <Title level={3} style={{ margin: '0 0 8px 0' }}>
                  {viewingPost.title}
                </Title>

                <div style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace', marginBottom: 16 }}>
                  {viewingPost.id}
                </div>

                <div style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
                  <Space size="large">
                    <span>작성자: {viewingPost.author}</span>
                    <span>조회수: {viewingPost.views}</span>
                    <span>생성: {new Date(viewingPost.created_at).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }).replace(/\. /g, '-').replace(/\.$/, '')}</span>
                    {viewingPost.published_at && (
                      <span>발행: {new Date(viewingPost.published_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }).replace(/\. /g, '-').replace(/\.$/, '')}</span>
                    )}
                  </Space>
                </div>
              </div>

              <Divider />

              {/* 게시글 내용 */}
              <div style={{ whiteSpace: 'pre-line', lineHeight: 1.8, fontSize: 16, minHeight: '200px' }}>
                {viewingPost.content}
              </div>

              {/* 메모 */}
              {viewingPost.excerpt && (
                <>
                  <Divider />
                  <div>
                    <Text strong style={{ color: '#666' }}>관리자 메모:</Text>
                    <div style={{
                      background: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '6px',
                      marginTop: '8px',
                      whiteSpace: 'pre-line'
                    }}>
                      {viewingPost.excerpt}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}