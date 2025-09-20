"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  Spin,
  Alert,
  Select,
  Row,
  Col,
  Pagination,
  Image,
  Tooltip,
  DatePicker,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  ReloadOutlined,
  FileImageOutlined,
  PlayCircleOutlined,
  FileUnknownOutlined,
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/components/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { getApiUrl } from "../../../utils/env";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Media 타입 정의
interface Media {
  id: string;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  original_name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  original_url: string;
  s3_upload_key: string;
  processing_status: "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED";
  processed_urls?: Record<string, string> | null;
  thumbnail_urls?: string[] | null;
  duration?: number | null;
  user_sub: string;
  is_deleted: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
  metadata?: {
    upload_source?: string;
    ip_address?: string;
    [key: string]: unknown;
  };
  processing_job_id?: string | null;
  s3_processed_keys?: Record<string, string> | null;
}

// 더미 데이터 생성 (실제 API 연동 전 까지 사용)
const generateDummyMedia = (): Media[] => {
  const apiUrl = getApiUrl() || "https://api.crefans.com"; // 환경변수가 없을 경우 기본값
  const types = ["IMAGE", "VIDEO", "AUDIO"] as const;
  const statuses = ["UPLOADING", "PROCESSING", "COMPLETED", "FAILED"] as const;
  const extensions = {
    IMAGE: ["jpg", "png", "gif", "webp"],
    VIDEO: ["mp4", "mov", "avi", "mkv"],
    AUDIO: ["mp3", "wav", "m4a"],
  };

  return Array.from({ length: 150 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const ext = extensions[type][Math.floor(Math.random() * extensions[type].length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const fileSize = Math.floor(Math.random() * 100000000); // 0~100MB
    // UUID 형식의 ID 생성
    const uuid = `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 14)}`;

    return {
      id: uuid,
      type,
      original_name: `file_${i + 1}.${ext}`,
      file_name: `${Date.now()}_${i}.${ext}`,
      file_size: fileSize,
      mime_type: type === "IMAGE" ? `image/${ext}` :
                 type === "VIDEO" ? `video/${ext}` :
                 type === "AUDIO" ? `audio/${ext}` :
                 `application/${ext}`,
      original_url: `${apiUrl}/media/${type.toLowerCase()}/${uuid}`,
      s3_upload_key: `media/2024/${i}/${Date.now()}.${ext}`,
      processing_status: status,
      processed_urls: status === "COMPLETED" ? {
        "1080p": `${apiUrl}/media/video/${uuid}?quality=1080p`,
        "720p": `${apiUrl}/media/video/${uuid}?quality=720p`,
      } : null,
      thumbnail_urls: type === "IMAGE" ? [
        `${apiUrl}/media/image/${uuid}?quality=thumbnail`,
      ] : type === "VIDEO" ? [
        // 비디오는 썸네일이 별도로 처리됨 (실제 구현에 따라 조정 필요)
        `${apiUrl}/media/video/${uuid}`, // 첫 프레임이나 포스터 이미지
      ] : null,
      duration: type === "VIDEO" ? Math.floor(Math.random() * 3600) :
                type === "AUDIO" ? Math.floor(Math.random() * 300) : null,
      user_sub: `user-${Math.floor(Math.random() * 100)}`,
      is_deleted: Math.random() > 0.9,
      deleted_at: Math.random() > 0.9 ? new Date(Date.now() - Math.random() * 86400000).toISOString() : undefined,
      created_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      processed_at: status === "COMPLETED" ? new Date(Date.now() - Math.random() * 86400000).toISOString() : undefined,
      metadata: {
        upload_source: ["web", "api", "mobile"][Math.floor(Math.random() * 3)],
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      },
      processing_job_id: status === "PROCESSING" ? `job-${Math.random().toString(36).substring(2, 10)}` : null,
      s3_processed_keys: status === "COMPLETED" ? {
        "1080p": `processed/1080p/${Date.now()}.mp4`,
        "720p": `processed/720p/${Date.now()}.mp4`,
      } : null
    };
  });
};

export default function MediaPage() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 미디어 데이터 가져오기 (현재는 더미 데이터)
  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);

      // 실제 API 호출 대신 더미 데이터 사용
      setTimeout(() => {
        const dummyData = generateDummyMedia();
        setMediaList(dummyData);
        setFilteredMedia(dummyData);
        setLoading(false);
      }, 1000);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to fetch media:", error);
      setError("미디어 목록을 불러오는데 실패했습니다.");
      setMediaList([]);
      setFilteredMedia([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  // 검색 및 필터링 로직
  useEffect(() => {
    let filtered = [...mediaList];

    // 텍스트 검색
    if (searchText.trim()) {
      const searchTerm = searchText.toLowerCase();
      filtered = filtered.filter((media) => {
        switch (searchField) {
          case "filename":
            return media.original_name?.toLowerCase().includes(searchTerm) ||
                   media.file_name?.toLowerCase().includes(searchTerm);
          case "id":
            return media.id?.toLowerCase().includes(searchTerm);
          case "user":
            return media.user_sub?.toLowerCase().includes(searchTerm);
          case "all":
          default:
            return (
              media.original_name?.toLowerCase().includes(searchTerm) ||
              media.file_name?.toLowerCase().includes(searchTerm) ||
              media.id?.toLowerCase().includes(searchTerm) ||
              media.user_sub?.toLowerCase().includes(searchTerm)
            );
        }
      });
    }

    // 타입 필터
    if (typeFilter !== "all") {
      filtered = filtered.filter(media => media.type === typeFilter);
    }

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter(media => media.processing_status === statusFilter);
    }

    // 삭제 필터
    if (deletedFilter === "active") {
      filtered = filtered.filter(media => !media.is_deleted);
    } else if (deletedFilter === "deleted") {
      filtered = filtered.filter(media => media.is_deleted);
    }

    // 날짜 범위 필터
    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(media => {
        const createdAt = dayjs(media.created_at);
        return createdAt.isAfter(dateRange[0]) && createdAt.isBefore(dateRange[1]);
      });
    }

    setFilteredMedia(filtered);
    setCurrentPage(1);
  }, [searchText, searchField, typeFilter, statusFilter, deletedFilter, dateRange, mediaList]);

  // 검색 초기화
  const handleClearFilters = () => {
    setSearchText("");
    setSearchField("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setDeletedFilter("active");
    setDateRange([null, null]);
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 시간 포맷 (동영상 길이)
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // 미디어 타입 아이콘
  const getMediaIcon = (type: string) => {
    switch (type) {
      case "IMAGE":
        return <FileImageOutlined style={{ color: "#52c41a" }} />;
      case "VIDEO":
        return <PlayCircleOutlined style={{ color: "#1890ff" }} />;
      default:
        return <FileUnknownOutlined style={{ color: "#666" }} />;
    }
  };

  // 처리 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PROCESSING":
        return "processing";
      case "FAILED":
        return "error";
      case "UPLOADING":
      default:
        return "default";
    }
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<Media> = [
    {
      title: "타입",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: string) => (
        <Space>
          {getMediaIcon(type)}
          <span>{type}</span>
        </Space>
      ),
    },
    {
      title: "미리보기",
      dataIndex: "thumbnail_urls",
      key: "preview",
      width: 80,
      render: (thumbnails: string[], record: Media) => {
        const apiUrl = getApiUrl() || "https://api.crefans.com";
        if (record.type === "IMAGE") {
          // 이미지는 직접 미디어 URL 사용
          const imageUrl = `${apiUrl}/media/image/${record.id}`;
          return (
            <Image
              alt="Image thumbnail"
              width={60}
              height={60}
              src={imageUrl}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAANlBMVEX////Ly8vIyMjMzMzPz8/S0tLV1dXY2Njb29ve3t7h4eHk5OTn5+fq6urw8PD19fX5+fn8/PzS8AYLAAACOUlEQVR4nO3c0XKCMBCFYRcIBEHA93/bVttOZ1rBZJPstOd8l3rhH9lAQphzAAAAAAAAAAAAAAAAAAD4Xy6Xf1FN9V3fD8MwdPVUTqffF8rbbhq8Ny5c9yYfLcdpSH9bTKUPy8oSw1x9Xy6/Ny+8m6N/JvK5+q5Y9F6yRF2ufqCchz0lhl79AGTfb1cilvlNz/cTIef5Tc/PE4VX7H8U6fsfsXUgUazvfw7Zyx+plvMT1ZL+R0xT/sik6n/ESPpBnfQHoF76M9qSvh+lPwe6pH8AStIPQKXJO1cl/QPoJD+AbuonIPoJLLqT/hPwqk9g8apPYFmuS/p3YKjT/h1YJspPYGlTPwEpz+iT8opQO6EB9LopDeDRCQ3gUQsNoOsjD+Bsn8CaWT+COQv/CAwifwJrRv0IsrT/EJI1/xBSlb7/0F9r/iFUTukBlGN2ACOnugdY9tl7APtRdwlYD7p7ACVv1vMfRW3+PXA5u2cfsL/vBuxb3S2A7YHwtHcOoDy+mAJYH+KMz+82x6DRAYBp9lMfAqxKzSXgZsEvcauQ4gZo0QqvgQttOQSohtCFu8Cga3OD7jpDSsxF5iJ0y9Y0hN0HpQOBi+DQ7X/NXeATCN3+N/kK7AmYvQLmuJvw+dE4hE1wAqthCJ3gFnBGxnv+S8RYEyifIC0XQJcmcJ5oFjhP9BeqSZD41Rt4nytjl7kAAAAAAAAAAAAAAAAAAAAAwBH8BLOKPKhwhHC7AAAAAElFTkSuQmCC"
              style={{ objectFit: "cover", borderRadius: 4 }}
            />
          );
        } else if (record.type === "VIDEO") {
          // 비디오는 썸네일 URL 또는 직접 미디어 URL 사용
          // 참고: 서버에 별도 비디오 썸네일 엔드포인트가 없으므로 thumbnail_urls 사용
          const videoThumbnailUrl = thumbnails?.length > 0 ? thumbnails[0] : `${apiUrl}/media/video/${record.id}`;
          return (
            <div style={{ position: "relative" }}>
              <Image
                alt="Video thumbnail"
                width={60}
                height={60}
                src={videoThumbnailUrl}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAANlBMVEX////Ly8vIyMjMzMzPz8/S0tLV1dXY2Njb29ve3t7h4eHk5OTn5+fq6urw8PD19fX5+fn8/PzS8AYLAAACOUlEQVR4nO3c0XKCMBCFYRcIBEHA93/bVttOZ1rBZJPstOd8l3rhH9lAQphzAAAAAAAAAAAAAAAAAAD4Xy6Xf1FN9V3fD8MwdPVUTqffF8rbbhq8Ny5c9yYfLcdpSH9bTKUPy8oSw1x9Xy6/Ny+8m6N/JvK5+q5Y9F6yRF2ufqCchz0lhl79AGTfb1cilvlNz/cTIef5Tc/PE4VX7H8U6fsfsXUgUazvfw7Zyx+plvMT1ZL+R0xT/sik6n/ESPpBnfQHoF76M9qSvh+lPwe6pH8AStIPQKXJO1cl/QPoJD+AbuonIPoJLLqT/hPwqk9g8apPYFmuS/p3YKjT/h1YJspPYGlTPwEpz+iT8opQO6EB9LopDeDRCQ3gUQsNoOsjD+Bsn8CaWT+COQv/CAwifwJrRv0IsrT/EJI1/xBSlb7/0F9r/iFUTukBlGN2ACOnugdY9tl7APtRdwlYD7p7ACVv1vMfRW3+PXA5u2cfsL/vBuxb3S2A7YHwtHcOoDy+mAJYH+KMz+82x6DRAYBp9lMfAqxKzSXgZsEvcauQ4gZo0QqvgQttOQSohtCFu8Cga3OD7jpDSsxF5iJ0y9Y0hN0HpQOBi+DQ7X/NXeATCN3+N/kK7AmYvQLmuJvw+dE4hE1wAqthCJ3gFnBGxnv+S8RYEyifIC0XQJcmcJ5oFjhP9BeqSZD41Rt4nytjl7kAAAAAAAAAAAAAAAAAAAAAwBH8BLOKPKhwhHC7AAAAAElFTkSuQmCC"
                style={{ objectFit: "cover", borderRadius: 4 }}
              />
              <PlayCircleOutlined
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: 24,
                  color: "white",
                  textShadow: "0 0 4px rgba(0,0,0,0.5)"
                }}
              />
            </div>
          );
        }
        return getMediaIcon(record.type);
      },
    },
    {
      title: "파일명",
      dataIndex: "original_name",
      key: "original_name",
      ellipsis: true,
      render: (name: string, record: Media) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 12, color: "#999" }}>{record.file_name}</div>
        </div>
      ),
    },
    {
      title: "크기",
      dataIndex: "file_size",
      key: "file_size",
      width: 100,
      render: (size: number) => formatFileSize(size),
      sorter: (a, b) => a.file_size - b.file_size,
    },
    {
      title: "해상도",
      key: "dimensions",
      width: 100,
      render: (_value: unknown, record: Media) => {
        // 나중에 metadata나 별도 필드에서 가져올 예정
        if (record.type === "IMAGE" || record.type === "VIDEO") {
          // 더미 데이터 - 실제 구현 시 metadata에서 추출
          return "1920×1080";
        }
        return "-";
      },
    },
    {
      title: "길이",
      dataIndex: "duration",
      key: "duration",
      width: 80,
      render: formatDuration,
    },
    {
      title: "S3 키",
      dataIndex: "s3_upload_key",
      key: "s3_upload_key",
      width: 200,
      ellipsis: true,
      render: (key: string) => (
        <Tooltip title={key}>
          <span style={{ fontSize: 11, fontFamily: "monospace" }}>{key}</span>
        </Tooltip>
      ),
    },
    {
      title: "처리 상태",
      dataIndex: "processing_status",
      key: "processing_status",
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === "COMPLETED" && "완료"}
          {status === "PROCESSING" && "처리중"}
          {status === "FAILED" && "실패"}
          {status === "UPLOADING" && "업로드중"}
        </Tag>
      ),
    },
    {
      title: "업로더",
      dataIndex: "user_sub",
      key: "user_sub",
      ellipsis: true,
      render: (userSub: string) => (
        <Tooltip title={userSub}>
          <span>{userSub.substring(0, 8)}...</span>
        </Tooltip>
      ),
    },
    {
      title: "업로드일",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: "상태",
      key: "status",
      width: 80,
      render: (_value: unknown, record: Media) => {
        if (record.is_deleted) {
          return <Tag color="error">삭제됨</Tag>;
        }
        return <Tag color="success">활성</Tag>;
      },
    },
    {
      title: "작업",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_value: unknown, record: Media) => (
        <Space size="small">
          <Tooltip title="상세보기">
            <Button size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="다운로드">
            <Button size="small" icon={<DownloadOutlined />} />
          </Tooltip>
          <Tooltip title="삭제">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 통계 카드 데이터
  const stats = {
    total: mediaList.length,
    images: mediaList.filter(m => m.type === "IMAGE").length,
    videos: mediaList.filter(m => m.type === "VIDEO").length,
    totalSize: mediaList.reduce((acc, m) => acc + m.file_size, 0),
    processing: mediaList.filter(m => m.processing_status === "PROCESSING").length,
    failed: mediaList.filter(m => m.processing_status === "FAILED").length,
  };

  // 페이지네이션을 위한 현재 페이지 데이터
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredMedia.slice(startIndex, endIndex);
  };

  // 테이블 선택 설정
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as string[]);
    },
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">미디어 관리</h1>
          <p className="text-gray-600">
            업로드된 미디어 파일 관리 (총 {filteredMedia.length}개)
          </p>
        </div>

        {error && (
          <Alert
            message="오류"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        {/* 통계 카드 */}
        <Row gutter={16}>
          <Col xs={24} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="전체 미디어"
                value={stats.total}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="이미지"
                value={stats.images}
                prefix={<FileImageOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="동영상"
                value={stats.videos}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="총 용량"
                value={formatFileSize(stats.totalSize)}
                prefix={<CloudServerOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="처리중"
                value={stats.processing}
                prefix={<InfoCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Card size="small">
              <Statistic
                title="실패"
                value={stats.failed}
                prefix={<WarningOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
        </Row>

        {/* 검색 및 필터 */}
        <Card>
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {/* 첫 번째 줄 - 검색 */}
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={6}>
                <Select
                  value={searchField}
                  onChange={setSearchField}
                  style={{ width: "100%" }}
                  placeholder="검색 필드 선택"
                >
                  <Option value="all">전체</Option>
                  <Option value="filename">파일명</Option>
                  <Option value="id">미디어 ID</Option>
                  <Option value="user">업로더</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12}>
                <Input
                  placeholder="검색어를 입력하세요..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={6}>
                <Space>
                  <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                    필터 초기화
                  </Button>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={fetchMedia}
                    loading={loading}
                  >
                    새로고침
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* 두 번째 줄 - 필터 */}
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={6}>
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: "100%" }}
                  placeholder="미디어 타입"
                >
                  <Option value="all">모든 타입</Option>
                  <Option value="IMAGE">이미지</Option>
                  <Option value="VIDEO">동영상</Option>
                  <Option value="AUDIO">오디오</Option>
                </Select>
              </Col>
              <Col xs={24} sm={6}>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: "100%" }}
                  placeholder="처리 상태"
                >
                  <Option value="all">모든 상태</Option>
                  <Option value="COMPLETED">완료</Option>
                  <Option value="PROCESSING">처리중</Option>
                  <Option value="FAILED">실패</Option>
                  <Option value="UPLOADING">업로드중</Option>
                </Select>
              </Col>
              <Col xs={24} sm={6}>
                <Select
                  value={deletedFilter}
                  onChange={setDeletedFilter}
                  style={{ width: "100%" }}
                  placeholder="삭제 상태"
                >
                  <Option value="all">전체</Option>
                  <Option value="active">활성</Option>
                  <Option value="deleted">삭제됨</Option>
                </Select>
              </Col>
              <Col xs={24} sm={6}>
                <RangePicker
                  style={{ width: "100%" }}
                  placeholder={["시작일", "종료일"]}
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                />
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 선택된 항목 액션 바 */}
        {selectedRowKeys.length > 0 && (
          <Alert
            message={`${selectedRowKeys.length}개 항목 선택됨`}
            description={
              <Space>
                <Button size="small" icon={<DownloadOutlined />}>
                  일괄 다운로드
                </Button>
                <Button size="small" danger icon={<DeleteOutlined />}>
                  일괄 삭제
                </Button>
              </Space>
            }
            type="info"
            showIcon
          />
        )}

        {/* 미디어 테이블 */}
        <Card>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={getCurrentPageData()}
            rowKey="id"
            pagination={false}
            loading={loading}
            scroll={{ x: 1400 }}
            size="middle"
          />

          {/* 페이지네이션 */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-gray-500">
              {filteredMedia.length > 0 && (
                <>
                  {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, filteredMedia.length)} / {filteredMedia.length}개
                </>
              )}
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredMedia.length}
              showSizeChanger
              showQuickJumper
              pageSizeOptions={["10", "20", "50", "100"]}
              onChange={(page, size) => {
                setCurrentPage(page);
                if (size !== pageSize) {
                  setPageSize(size);
                }
              }}
              showTotal={(total, range) => `${range[0]}-${range[1]} / ${total}개`}
            />
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}