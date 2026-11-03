import {defineConfig,devices} from '@playwright/test';

// Interaction tests stub admin APIs and never require an operator session or database.
export default defineConfig({
 testDir:'./e2e',testMatch:'category-drag.spec.ts',workers:1,retries:0,timeout:45000,expect:{timeout:10000},
 reporter:[['list'],['json',{outputFile:'.local/category-vertical-drag-20261103/results.json'}]],
 outputDir:'.local/category-vertical-drag-20261103/results',
 use:{baseURL:'http://127.0.0.1:3044',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[
  {name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},
  {name:'mobile-chromium',use:{...devices['iPhone 13'],browserName:'chromium'}},
  {name:'mobile-webkit',use:{...devices['iPhone 13'],browserName:'webkit'}}
 ],
 webServer:{command:'NEXT_DIST_DIR=.next-drag npx next dev -H 127.0.0.1 -p 3044',url:'http://127.0.0.1:3044/login',reuseExistingServer:false,timeout:120000,gracefulShutdown:{signal:'SIGTERM',timeout:10000}}
});
