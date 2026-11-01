import {defineConfig} from '@playwright/test';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
const server=path.resolve('../crefans_server');
process.env.ADMIN_E2E_PASSWORD=process.env.ADMIN_E2E_PASSWORD||randomBytes(24).toString('base64url');
process.env.ADMIN_E2E_EMAIL=process.env.ADMIN_E2E_EMAIL||`admin-${randomBytes(8).toString('hex')}@console-test.invalid`;
export default defineConfig({testDir:'./e2e',workers:1,fullyParallel:false,timeout:60000,expect:{timeout:15000},forbidOnly:!!process.env.CI,retries:0,reporter:[['list'],['html',{open:'never'}]],use:{baseURL:'http://127.0.0.1:3003',trace:'retain-on-failure',screenshot:'only-on-failure'},webServer:[
{command:'node tests/admin-console-server.cjs',cwd:server,url:'http://127.0.0.1:3013/api/v1/health',reuseExistingServer:false,timeout:60000,gracefulShutdown:{signal:'SIGTERM',timeout:15000},env:{CREFANS_E2E:'true',ADMIN_E2E_PASSWORD:process.env.ADMIN_E2E_PASSWORD,ADMIN_E2E_EMAIL:process.env.ADMIN_E2E_EMAIL}},
{command:'NEXT_DIST_DIR=.next-e2e CREFANS_API_ORIGIN=http://127.0.0.1:3013 npx next dev -H 127.0.0.1 -p 3003',url:'http://127.0.0.1:3003/login',reuseExistingServer:false,timeout:120000,gracefulShutdown:{signal:'SIGTERM',timeout:15000}},
]});
