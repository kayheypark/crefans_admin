import base from './playwright.config';
import {defineConfig,devices} from '@playwright/test';
// QA run config (2026-10-31): same isolated console/API servers, separate PC and Mobile projects, screenshot and trace per test.
const out=process.env.QA_RUN_DIR||'.local/qa-run';
export default defineConfig({...base,outputDir:`${out}/results`,timeout:90000,
 reporter:[['list'],['json',{outputFile:`${out}/playwright-results.json`}]],
 use:{...base.use,trace:'on',screenshot:'on'},
 projects:[
  {name:'pc',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
  {name:'mobile',use:{...devices['Pixel 7'],viewport:{width:390,height:844}}},
 ]});
