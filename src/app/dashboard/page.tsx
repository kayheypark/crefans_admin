"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Spin } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  DollarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AdminLayout from "@/components/AdminLayout";
import { adminApi } from "@/lib/api";

interface DashboardStats {
  totalUsers: number;
  totalCreators: number;
  totalPosts: number;
  totalReports: number;
  activeSubscriptions: number;
}

interface UserGrowthData {
  date: string;
  count: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Use real API calls
      const [statsResponse, growthResponse] = await Promise.all([
        adminApi.dashboard.getStats(),
        adminApi.dashboard.getUserGrowth(),
      ]);

      setStats(statsResponse.data);
      setUserGrowth(growthResponse.data);
    } catch (err: unknown) {
      console.error("Failed to fetch dashboard data:", err);

      // Fallback to mock data when API is unavailable
      setStats({
        totalUsers: 0,
        totalCreators: 0,
        totalPosts: 0,
        totalReports: 0,
        activeSubscriptions: 0,
      });
      setUserGrowth([]);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">대시보드</h1>
          <p className="text-gray-600">플랫폼 주요 지표 개요</p>
        </div>

        {/* Key Metrics */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="전체 사용자"
                value={stats?.totalUsers || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="전체 크리에이터"
                value={stats?.totalCreators || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="전체 포스팅"
                value={stats?.totalPosts || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="처리대기 신고"
                value={stats?.totalReports || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card>
              <Statistic
                title="활성 구독"
                value={stats?.activeSubscriptions || 0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card>
              <Statistic
                title="월 매출"
                value={127500}
                prefix={<DollarOutlined />}
                suffix="원"
                precision={0}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
        </Row>

        {/* User Growth Chart */}
        <Card title="사용자 증가 (최근 7일)" className="mt-6">
          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1890ff"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
