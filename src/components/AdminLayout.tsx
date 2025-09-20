"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, Avatar, Dropdown, Spin } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  WarningOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { TokenExpiryTimer } from "./TokenExpiryTimer";

const { Header, Sider, Content } = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // All hooks must be called before any early returns
  const handleMenuClick = useCallback(
    (key: string) => {
      router.push(key);
    },
    [router]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    // No need to manually redirect here - logout function handles it
  }, [logout]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "대시보드",
    },
    {
      key: "/users",
      icon: <TeamOutlined />,
      label: "사용자 관리",
    },
    {
      key: "/posts",
      icon: <FileTextOutlined />,
      label: "포스팅 관리",
    },
    {
      key: "/media",
      icon: <PictureOutlined />,
      label: "미디어 관리",
    },
    {
      key: "/board",
      icon: <FileTextOutlined />,
      label: "게시판 관리",
    },
    {
      key: "/reports",
      icon: <WarningOutlined />,
      label: "신고 관리",
    },
  ];

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "로그아웃",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="flex items-center justify-center h-16 bg-blue-600">
          <h1 className="text-white font-bold text-lg">
            {collapsed ? "CA" : "크리팬스 관리자"}
          </h1>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname === "/" ? "/dashboard" : pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            left: collapsed ? 80 : 200,
            zIndex: 1000,
            padding: "0 24px",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-lg text-gray-600 hover:text-gray-900"
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <TokenExpiryTimer />
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div className="flex items-center cursor-pointer hover:bg-gray-100 px-3 py-2 rounded">
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    className="mr-2"
                  />
                  <div className="flex flex-col text-sm">
                    <span className="text-gray-700 font-medium">
                      {user.name}
                    </span>
                    <span className="text-gray-500 text-xs">{user.role}</span>
                  </div>
                </div>
              </Dropdown>
            </div>
          </div>
        </Header>

        <Content
          style={{
            marginTop: 64,
            padding: "24px",
            background: "#f5f5f5",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
