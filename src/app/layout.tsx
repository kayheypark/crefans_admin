import type { Metadata, Viewport } from "next";
import { ConfigProvider, App as AntdApp } from "antd";
import StyledComponentsRegistry from "../../lib/AntdRegistry";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense } from "react";
import "antd/dist/reset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crefans Admin",
  description: "Administrative dashboard for Crefans platform",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <StyledComponentsRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#1890ff",
                colorBgContainer: "#fff",
              },
            }}
          >
            <AntdApp>
              <AuthProvider>
                <Suspense fallback={<div>Loading...</div>}>
                  {children}
                </Suspense>
              </AuthProvider>
            </AntdApp>
          </ConfigProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
