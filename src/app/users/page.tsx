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
} from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/components/AdminLayout";
import { adminApi } from "@/lib/api";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;

interface User {
  username: string;
  email: string;
  name: string;
  nickname: string;
  phoneNumber: string;
  isCreator: boolean;
  emailVerified: boolean;
  userStatus: string;
  enabled: boolean;
  createdDate: string;
  lastModifiedDate: string;
  sub: string;
}


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState<string>("all");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 사용자 데이터 가져오기
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.users.list({
        limit: 100, // 많은 사용자를 가져와서 프론트엔드에서 검색/필터링
      });

      setUsers(response.data.users || []);
      setFilteredUsers(response.data.users || []);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to fetch users:", error);
      setError("사용자 목록을 불러오는데 실패했습니다. 서버 연결을 확인해주세요.");
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 검색 필터링 로직
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter((user) => {
      const searchTerm = searchText.toLowerCase();

      switch (searchField) {
        case "email":
          return user.email?.toLowerCase().includes(searchTerm);
        case "name":
          return user.name?.toLowerCase().includes(searchTerm);
        case "nickname":
          return user.nickname?.toLowerCase().includes(searchTerm);
        case "phone":
          return user.phoneNumber?.includes(searchText);
        case "username":
          return user.username?.toLowerCase().includes(searchTerm);
        case "sub":
          return user.sub?.toLowerCase().includes(searchTerm);
        case "all":
        default:
          return (
            user.email?.toLowerCase().includes(searchTerm) ||
            user.name?.toLowerCase().includes(searchTerm) ||
            user.nickname?.toLowerCase().includes(searchTerm) ||
            user.username?.toLowerCase().includes(searchTerm) ||
            user.phoneNumber?.includes(searchText) ||
            user.sub?.toLowerCase().includes(searchTerm)
          );
      }
    });

    setFilteredUsers(filtered);
    setCCurrentPage(1); // 검색 시 첫 페이지로 이동
  }, [searchText, searchField, users]);

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchText("");
    setSearchField("all");
  };

  // 테이블 컬럼 정의
  const columns: ColumnsType<User> = [
    {
      title: "이메일",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
      render: (email: string, record: User) => (
        <div>
          <div>{email}</div>
          {record.emailVerified ? (
            <Tag color="green">인증완료</Tag>
          ) : (
            <Tag color="red">미인증</Tag>
          )}
        </div>
      ),
    },
    {
      title: "이름",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "닉네임",
      dataIndex: "nickname",
      key: "nickname",
      ellipsis: true,
    },
    {
      title: "전화번호",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      ellipsis: true,
    },
    {
      title: "사용자 유형",
      dataIndex: "isCreator",
      key: "isCreator",
      render: (isCreator: boolean) => (
        <Tag color={isCreator ? "purple" : "blue"}>
          {isCreator ? "크리에이터" : "일반사용자"}
        </Tag>
      ),
    },
    {
      title: "상태",
      dataIndex: "userStatus",
      key: "userStatus",
      render: (status: string, record: User) => {
        let color = "default";
        let text = status;

        switch (status) {
          case "CONFIRMED":
            color = "green";
            text = "활성";
            break;
          case "UNCONFIRMED":
            color = "orange";
            text = "미확인";
            break;
          case "ARCHIVED":
            color = "red";
            text = "비활성";
            break;
          case "COMPROMISED":
            color = "red";
            text = "보안위험";
            break;
          case "UNKNOWN":
            color = "gray";
            text = "알수없음";
            break;
          case "RESET_REQUIRED":
            color = "yellow";
            text = "재설정필요";
            break;
          case "FORCE_CHANGE_PASSWORD":
            color = "orange";
            text = "비밀번호변경필요";
            break;
        }

        return (
          <div>
            <Tag color={color}>{text}</Tag>
            {!record.enabled && <Tag color="red">비활성화</Tag>}
          </div>
        );
      },
    },
    {
      title: "가입일",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date: string) => {
        return date ? new Date(date).toLocaleDateString('ko-KR') : "-";
      },
    },
    {
      title: "최종 수정일",
      dataIndex: "lastModifiedDate",
      key: "lastModifiedDate",
      render: (date: string) => {
        return date ? new Date(date).toLocaleDateString('ko-KR') : "-";
      },
    },
  ];

  // 페이지네이션을 위한 현재 페이지 데이터 계산
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">사용자 관리</h1>
          <p className="text-gray-600">
            Cognito에서 관리되는 사용자 목록 (총 {filteredUsers.length}명)
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

        {/* 검색 및 필터 */}
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={6}>
              <Select
                value={searchField}
                onChange={setSearchField}
                style={{ width: "100%" }}
                placeholder="검색 필드 선택"
              >
                <Option value="all">전체</Option>
                <Option value="email">이메일</Option>
                <Option value="name">이름</Option>
                <Option value="nickname">닉네임</Option>
                <Option value="phone">전화번호</Option>
                <Option value="username">사용자명</Option>
                <Option value="sub">Sub ID</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12}>
              <Input
                placeholder={
                  searchField === "all"
                    ? "전체 필드에서 검색..."
                    : `${searchField === "email" ? "이메일" :
                         searchField === "name" ? "이름" :
                         searchField === "nickname" ? "닉네임" :
                         searchField === "phone" ? "전화번호" :
                         searchField === "username" ? "사용자명" : "Sub ID"}로 검색...`
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={6}>
              <Space>
                <Button icon={<ClearOutlined />} onClick={handleClearSearch}>
                  초기화
                </Button>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchUsers}
                  loading={loading}
                >
                  새로고침
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 사용자 테이블 */}
        <Card>
          <Table
            columns={columns}
            dataSource={getCurrentPageData()}
            rowKey="sub"
            pagination={false}
            loading={loading}
            scroll={{ x: 1200 }}
            size="middle"
          />

          {/* 커스텀 페이지네이션 */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-gray-500">
              {filteredUsers.length > 0 && (
                <>
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredUsers.length)} / {filteredUsers.length}명
                </>
              )}
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredUsers.length}
              showSizeChanger
              showQuickJumper
              pageSizeOptions={['10', '20', '50', '100']}
              onChange={(page, size) => {
                setCCurrentPage(page);
                if (size !== pageSize) {
                  setPageSize(size);
                }
              }}
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} / ${total}명`
              }
            />
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}