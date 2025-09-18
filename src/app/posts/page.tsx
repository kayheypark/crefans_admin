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
  Modal,
  Typography,
  Divider,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/components/AdminLayout";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import { PrivacyToggleApiResponse } from "@/types/api";
import { getApiUrl } from "../../../utils/env";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

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
  user?: {
    id: string;
    handle: string;
    name: string;
    avatar: string;
    isCreator: boolean;
  };
  total_view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  published_at: string | null;
  medias?: {
    id: string;
    type: string;
    file_name: string;
    content_type?: string;
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
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingPost, setViewingPost] = useState<Posting | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [privacyLoading, setPrivacyLoading] = useState<string | null>(null);

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
      setPagination((prev) => ({
        ...prev,
        total: response.data.data.total,
      }));
    } catch (error) {
      console.error("Failed to fetch postings:", error);
      message.error("Failed to load postings from server");

      // Set empty data on error
      setPosts([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
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

  const handleViewPost = async (postId: string) => {
    try {
      setLoading(true);
      const response = await adminApi.postings.get(postId);
      if (response.data.success) {
        setViewingPost(response.data.data);
        setViewModalVisible(true);
      } else {
        message.error("포스팅 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("Failed to fetch posting details:", error);
      message.error("포스팅 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = async (
    postId: string,
    currentIsPublic: boolean
  ) => {
    try {
      setPrivacyLoading(postId);
      const isPrivate = currentIsPublic;

      const response = await adminApi.postings.togglePrivacy(postId, isPrivate);

      if (response.data.success) {
        const updatedIsPublic = response.data.data.isPublic;

        // 테이블의 해당 포스팅 상태 업데이트
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, is_public: updatedIsPublic } : post
          )
        );

        // 모달이 열려있다면 모달의 포스팅 정보도 업데이트
        if (viewingPost && viewingPost.id === postId) {
          setViewingPost({ ...viewingPost, is_public: updatedIsPublic });
        }

        message.success(
          updatedIsPublic
            ? "포스팅이 공개로 변경되었습니다."
            : "포스팅이 비공개로 변경되었습니다."
        );
      } else {
        message.error("포스팅 공개/비공개 설정 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to toggle posting privacy:", error);
      message.error("포스팅 공개/비공개 설정 변경 중 오류가 발생했습니다.");
    } finally {
      setPrivacyLoading(null);
    }
  };

  // Lightbox용 슬라이드 생성
  const getLightboxSlides = () => {
    if (!viewingPost?.medias) return [];

    const slides: Array<{
      src?: string;
      alt?: string;
      type?: "video";
      sources?: Array<{ src: string; type: string }>;
    }> = [];

    viewingPost.medias
      .filter((media) => media.type === "IMAGE" || media.type === "VIDEO")
      .forEach((media) => {
        const mediaUrl = getMediaUrl(media);
        if (!mediaUrl) return;

        if (detectMediaType(media) === "image") {
          slides.push({
            src: mediaUrl,
            alt: media.file_name || "이미지",
          });
        } else {
          slides.push({
            type: "video" as const,
            sources: [
              {
                src: mediaUrl,
                type: media.content_type || "video/mp4",
              },
            ],
          });
        }
      });

    return slides;
  };

  // 미디어 클릭 핸들러
  const handleMediaClick = (mediaIndex: number) => {
    setLightboxIndex(mediaIndex);
    setLightboxOpen(true);
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

  // 미디어 타입 감지 함수 (crefans_front 방식 적용)
  const detectMediaType = (media: {
    type: string;
    file_name: string;
    content_type?: string;
  }): "image" | "video" | "unknown" => {
    // 1. content_type이 있으면 우선 사용
    if (media.content_type) {
      if (media.content_type.startsWith("image/")) return "image";
      if (media.content_type.startsWith("video/")) return "video";
    }

    // 2. type 필드 확인
    if (media.type === "IMAGE") return "image";
    if (media.type === "VIDEO") return "video";

    // 3. 파일 확장자로 판단
    const videoExtensions = [
      ".mp4",
      ".avi",
      ".mov",
      ".wmv",
      ".flv",
      ".webm",
      ".mkv",
    ];
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
      ".svg",
    ];
    const extension = media.file_name?.toLowerCase().split(".").pop();

    if (extension) {
      if (videoExtensions.some((ext) => ext.includes(extension)))
        return "video";
      if (imageExtensions.some((ext) => ext.includes(extension)))
        return "image";
    }

    return "unknown";
  };

  const getMediaUrl = (media: {
    id: string;
    type: string;
    content_type?: string;
    file_name: string;
  }) => {
    const apiUrl = getApiUrl();
    const mediaType = detectMediaType(media);

    if (mediaType === "image") {
      return `${apiUrl}/media/image/${media.id}`;
    } else if (mediaType === "video") {
      return `${apiUrl}/media/video/${media.id}`;
    }
    return null;
  };

  const renderMedia = (
    media: {
      id: string;
      type: string;
      file_name: string;
      content_type?: string;
    },
    index: number
  ) => {
    const mediaUrl = getMediaUrl(media);
    const mediaType = detectMediaType(media);

    if (!mediaUrl) {
      return (
        <Tag key={media.id} color="default" style={{ margin: "4px" }}>
          {media.file_name}
        </Tag>
      );
    }

    if (mediaType === "image") {
      return (
        <div
          key={media.id}
          style={{ margin: "8px", display: "inline-block", cursor: "pointer" }}
        >
          <img
            src={mediaUrl}
            alt={media.file_name}
            style={{
              maxWidth: "200px",
              maxHeight: "200px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid #d9d9d9",
              transition: "transform 0.2s ease-in-out",
            }}
            onClick={() => handleMediaClick(index)}
            onMouseEnter={(e) => {
              (e.target as HTMLImageElement).style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLImageElement).style.transform = "scale(1)";
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.nextElementSibling!.textContent = `❌ ${media.file_name} (로드 실패)`;
            }}
          />
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginTop: "4px",
              textAlign: "center",
            }}
          >
            {media.file_name}
          </div>
        </div>
      );
    } else if (mediaType === "video") {
      return (
        <div
          key={media.id}
          style={{
            margin: "8px",
            display: "inline-block",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <video
            src={mediaUrl}
            style={{
              maxWidth: "300px",
              maxHeight: "200px",
              borderRadius: "8px",
              border: "1px solid #d9d9d9",
              transition: "transform 0.2s ease-in-out",
            }}
            preload="metadata"
            onClick={() => handleMediaClick(index)}
            onMouseEnter={(e) => {
              (e.target as HTMLVideoElement).style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLVideoElement).style.transform = "scale(1)";
            }}
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              target.style.display = "none";
              target.nextElementSibling!.textContent = `❌ ${media.file_name} (로드 실패)`;
            }}
          />
          {/* 재생 아이콘 오버레이 */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              borderRadius: "50%",
              padding: "8px",
              color: "white",
              fontSize: "20px",
              pointerEvents: "none",
            }}
          >
            ▶
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginTop: "4px",
              textAlign: "center",
            }}
          >
            {media.file_name}
          </div>
        </div>
      );
    }

    return (
      <Tag key={media.id} color="blue" style={{ margin: "4px" }}>
        {media.file_name}
      </Tag>
    );
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
          <div className="text-xs text-gray-500">
            작성자:{" "}
            {record.user
              ? `${record.user.name} (@${record.user.handle})`
              : record.user_sub}
            {record.user && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                record.user.isCreator
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {record.user.isCreator ? '크리에이터' : '일반회원'}
              </span>
            )}
          </div>
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
            <Tag color="red" icon={<EyeInvisibleOutlined />}>
              관리자에 의하여 비공개
            </Tag>
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
          <div className="text-sm">
            조회 {record._count?.views || record.total_view_count}
          </div>
          <div className="text-sm">
            좋아요 {record._count?.likes || record.like_count}
          </div>
          <div className="text-sm">
            댓글 {record._count?.comments || record.comment_count}
          </div>
        </Space>
      ),
    },
    {
      title: "날짜",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string, record: Posting) => (
        <Space direction="vertical" size={0}>
          <div className="text-sm">
            작성 {format(new Date(text), "yyyy-MM-dd HH:mm")}
          </div>
          {record.published_at && (
            <div className="text-sm">
              발행 {format(new Date(record.published_at), "yyyy-MM-dd HH:mm")}
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
          <Tooltip title={record.is_public ? "비공개로 변경" : "공개로 변경"}>
            <Button
              type="text"
              icon={record.is_public ? <LockOutlined /> : <UnlockOutlined />}
              size="small"
              loading={privacyLoading === record.id}
              onClick={() => handleTogglePrivacy(record.id, record.is_public)}
              danger={record.is_public}
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">포스팅 관리</h1>
          <p className="text-gray-600">
            크리에이터 및 일반회원이 작성한 콘텐츠를 관리합니다.
          </p>
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

        {/* 포스팅 보기 모달 */}
        <Modal
          title="포스팅 보기"
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          width={800}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              닫기
            </Button>,
          ]}
        >
          {viewingPost && (
            <div style={{ padding: "20px 0" }}>
              {/* 포스팅 헤더 */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {getStatusTag(viewingPost.status)}
                  {viewingPost.is_public ? (
                    <Tag color="green">공개</Tag>
                  ) : (
                    <Tag color="red">관리자에 의하여 비공개</Tag>
                  )}
                  {viewingPost.is_membership && (
                    <Tag color="blue">멤버 전용</Tag>
                  )}
                  {viewingPost.is_sensitive && (
                    <Tag color="orange">민감 콘텐츠</Tag>
                  )}
                  {viewingPost.is_deleted && <Tag color="red">삭제됨</Tag>}
                </div>
                <Title level={3} style={{ margin: "0 0 8px 0" }}>
                  {viewingPost.title}
                </Title>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    fontFamily: "monospace",
                    marginBottom: 16,
                  }}
                >
                  {viewingPost.id}
                </div>
                <div style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
                  <Space size="large">
                    <span>
                      작성자:{" "}
                      {viewingPost.user
                        ? `${viewingPost.user.name} (@${viewingPost.user.handle})`
                        : viewingPost.user_sub}
                      {viewingPost.user && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                          viewingPost.user.isCreator
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {viewingPost.user.isCreator ? '크리에이터' : '일반회원'}
                        </span>
                      )}
                    </span>
                    <span>조회수: {viewingPost.total_view_count}</span>
                    <span>좋아요: {viewingPost.like_count}</span>
                    <span>댓글: {viewingPost.comment_count}</span>
                  </Space>
                </div>
                <div style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
                  <Space size="large">
                    <span>
                      작성:{" "}
                      {format(
                        new Date(viewingPost.created_at),
                        "yyyy-MM-dd HH:mm"
                      )}
                    </span>
                    {viewingPost.published_at && (
                      <span>
                        발행:{" "}
                        {format(
                          new Date(viewingPost.published_at),
                          "yyyy-MM-dd HH:mm"
                        )}
                      </span>
                    )}
                  </Space>
                </div>
              </div>

              {/* 포스팅 내용 */}
              <Divider />
              <div
                style={{
                  background: "#fafafa",
                  padding: "20px",
                  borderRadius: "8px",
                  minHeight: "200px",
                  whiteSpace: "pre-line",
                  lineHeight: "1.6",
                }}
              >
                {viewingPost.content}
              </div>

              {/* 첨부된 미디어 */}
              {viewingPost.medias && viewingPost.medias.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <Text strong style={{ color: "#666" }}>
                      첨부 미디어:
                    </Text>
                    <div
                      style={{
                        marginTop: "16px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        alignItems: "flex-start",
                      }}
                    >
                      {viewingPost.medias.map((media, index) =>
                        renderMedia(media, index)
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>

        {/* Lightbox Gallery */}
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          // @ts-expect-error - Lightbox 타입 호환성 문제
          slides={getLightboxSlides()}
          plugins={[Video]}
        />
      </div>
    </AdminLayout>
  );
}
