export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL;
};

export const getBaseUrl = () => {
  // 개발 환경
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3002";
  }

  // 프로덕션 환경
  return "https://admin.crefans.com";
};

export const getPostUrl = (postId: string) => {
  // 메인 사이트로 링크 (관리자는 별도 도메인)
  const mainBaseUrl = process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://crefans.com";
  return `${mainBaseUrl}/post/${postId}`;
};