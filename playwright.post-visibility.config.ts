import {defineConfig,devices} from '@playwright/test';
// Post moderation/visibility console cases (2026-11-07): every API is stubbed in the spec; no server or database is started.
export default defineConfig({testDir:'./e2e',testMatch:['moderation.spec.ts'],workers:1,retries:0,timeout:60000,expect:{timeout:15000},outputDir:'.local/post-unpublish-20261107/results',reporter:[['list']],
 use:{baseURL:'http://127.0.0.1:3046',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},{name:'mobile-chromium',use:{...devices['iPhone 13'],browserName:'chromium'}}],
 webServer:{command:'NEXT_DIST_DIR=.next-post-visibility npx next dev -H 127.0.0.1 -p 3046',url:'http://127.0.0.1:3046/login',reuseExistingServer:false,timeout:180000,gracefulShutdown:{signal:'SIGTERM',timeout:10000}}});
