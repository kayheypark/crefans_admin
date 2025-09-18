"use client";

import { useState, useEffect } from "react";
import { Tag } from "antd";
import { ClockCircleOutlined, SafetyOutlined } from "@ant-design/icons";
import {
  getAuthTimeUntilExpiryFormatted,
  getAuthTimeUntilExpiry,
  isAuthTokenExpired,
} from "@/utils/auth";

export function TokenExpiryTimer() {
  const [timeLeft, setTimeLeft] = useState<string>("--:--");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      if (isAuthTokenExpired()) {
        setTimeLeft("만료됨");
        setIsExpired(true);
        return;
      }

      const timeMs = getAuthTimeUntilExpiry();
      if (timeMs <= 0) {
        setTimeLeft("만료됨");
        setIsExpired(true);
        return;
      }

      setTimeLeft(getAuthTimeUntilExpiryFormatted());
      setIsExpired(false);
    };

    // 즉시 한 번 업데이트
    updateTimer();

    // 1초마다 업데이트
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTagColor = () => {
    if (isExpired) return "red";

    const timeMs = getAuthTimeUntilExpiry();
    const minutes = Math.floor(timeMs / (60 * 1000));

    if (minutes <= 2) return "red";
    if (minutes <= 5) return "orange";
    return "green";
  };

  return (
    <div className="flex items-center">
      <Tag
        // icon={<ClockCircleOutlined />}
        icon={<SafetyOutlined />}
        color={getTagColor()}
        style={{ margin: 0, fontSize: "12px" }}
      >
        {timeLeft}
      </Tag>
    </div>
  );
}
