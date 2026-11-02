import {defineConfig,devices} from '@playwright/test';
import path from 'node:path';

// Display-only regression suite: every admin API response is supplied by the spec.
export default defineConfig({
 testDir:'.',testMatch:'beans-empty.spec.ts',workers:1,timeout:45000,expect:{timeout:10000},
 reporter:[['list'],['json',{outputFile:path.resolve(__dirname,'../test-results/beans-empty-results.json')}]],
 outputDir:path.resolve(__dirname,'../test-results/beans-empty'),
 use:{baseURL:'http://127.0.0.1:3003',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[
  {name:'pc',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},
  {name:'mobile',use:{...devices['iPhone 13']}},
 ],
 webServer:{command:'NEXT_DIST_DIR=.next-e2e CREFANS_API_ORIGIN=http://127.0.0.1:3013 npx next dev -H 127.0.0.1 -p 3003',cwd:path.resolve(__dirname,'..'),url:'http://127.0.0.1:3003/login',reuseExistingServer:false,timeout:120000},
});
