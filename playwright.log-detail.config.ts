import {defineConfig,devices} from '@playwright/test';

// All APIs in these display-only cases are stubbed; no operator session or database.
export default defineConfig({
 testDir:'./e2e',testMatch:['log-detail.spec.ts','modal-layer.spec.ts'],workers:1,retries:0,timeout:45000,expect:{timeout:10000},
 outputDir:'.local/log-detail-modal-20261103/results',reporter:[['list'],['json',{outputFile:'.local/log-detail-modal-20261103/results.json'}]],
 use:{baseURL:'http://127.0.0.1:3045',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[
  {name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},
  {name:'mobile-chromium',use:{...devices['iPhone 13'],browserName:'chromium'}},
  {name:'mobile-webkit',use:{...devices['iPhone 13'],browserName:'webkit'}}
 ],
 webServer:{command:'NEXT_DIST_DIR=.next-log-detail npx next dev -H 127.0.0.1 -p 3045',url:'http://127.0.0.1:3045/login',reuseExistingServer:false,timeout:120000,gracefulShutdown:{signal:'SIGTERM',timeout:10000}}
});
