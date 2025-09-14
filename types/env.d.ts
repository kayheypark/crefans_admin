declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_APP_ENV: 'development' | 'prod';
    NEXT_PUBLIC_APP_VERSION: string;
    NEXT_PUBLIC_AWS_REGION?: string;
    NEXT_PUBLIC_AWS_USER_POOL_ID?: string;
    NEXT_PUBLIC_AWS_CLIENT_ID?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
  }
}